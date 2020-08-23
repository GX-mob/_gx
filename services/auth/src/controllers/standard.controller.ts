/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Controller, Inject, GET, POST } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  DataService,
  SessionService,
  ContactVerificationService,
  util,
} from "@gx-mob/http-service";
import HttpError from "http-errors";

import IdentifyBodySchema from "../schemas/id-body.json";
import CredentialsBodySchema from "../schemas/credentials-body.json";
import CodeBodySchema from "../schemas/code-body.json";
import { CredentialsBodySchema as ICredentialsBodySchema } from "../types/credentials-body";
import { CodeBodySchema as ICodeBodySchema } from "../types/code-body";
import { IdentifyBodySchema as IIdentifyBodySchema } from "../types/id-body";

@Controller("/")
export default class StandardAuthController {
  @Inject(DataService)
  private data!: DataService;

  @Inject(SessionService)
  private session!: SessionService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @POST("/id", {
    schema: {
      body: IdentifyBodySchema,
      response: {
        "200": {
          type: "object",
          properties: {
            firstName: { type: "string" },
            avatar: { type: "string" },
          },
        },
        "202": {
          type: "object",
          properties: {
            firstName: { type: "string" },
            avatar: { type: "string" },
            last4: { type: "string" },
          },
        },
      },
    },
  })
  async identifyHandler(
    request: FastifyRequest<{ Body: IIdentifyBodySchema }>,
    reply: FastifyReply
  ) {
    const { password, phones, firstName, avatar } = (
      await this.getUser(request.body.id)
    ).user;

    if (!password) {
      await this.requestVerify(phones[0]);
      reply.code(202);

      return {
        firstName,
        avatar,
        last4: phones[0].slice(phones[0].length - 4),
      };
    }

    return {
      firstName,
      avatar,
    };
  }

  @POST("/sign-in", {
    schema: {
      body: CredentialsBodySchema,
      response: {
        "201": {
          type: "object",
          properties: {
            token: { type: "string" },
          },
        },
        "202": {
          type: "object",
          properties: {
            target: { type: "string" },
          },
        },
      },
    },
  })
  async credentialHandler(
    request: FastifyRequest<{ Body: ICredentialsBodySchema }>,
    reply: FastifyReply
  ) {
    const { id, password } = request.body;
    const { user } = await this.getUser(id);

    await util.assertPassword(
      {
        value: password,
        to: user.password as Buffer,
        be: true,
      },
      "wrong-password"
    );

    if (user["2fa"]) {
      await this.requestVerify(user["2fa"]);

      reply.code(202);

      if (util.emailRegex.test(user["2fa"])) {
        const [name, domain] = user["2fa"].split("@");
        return {
          target: `${name.slice(0, 3).padEnd(name.length, "*")}@${domain}`,
        };
      }

      return {
        target: user["2fa"].slice(user["2fa"].length - 4),
      };
    }

    const { token } = await this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw)
    );

    reply.code(201);
    return { token };
  }

  @POST("/code", {
    schema: {
      body: CodeBodySchema,
      response: {
        "201": {
          type: "object",
          properties: {
            token: { type: "string" },
          },
        },
      },
    },
  })
  async codeHandler(
    request: FastifyRequest<{ Body: ICodeBodySchema }>,
    reply: FastifyReply
  ) {
    const { id, code } = request.body;
    const { user, contact } = await this.getUser(id);

    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        const { token } = await this.session.create(
          user,
          request.headers["user-agent"] as string,
          util.getClientIp(request.raw)
        );

        reply.code(201);
        return { token };
      }

      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const valid = await this.verify.verify(contact, code);

    if (!valid) {
      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const { token } = await this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw)
    );

    reply.code(201);
    return { token };
  }

  /**
   * Useful methods
   */
  /** */
  private async getUser(id: string | IIdentifyBodySchema["id"]) {
    const { value: contact, field } = util.isValidContact(id);
    const user = await this.data.users.get({ [field]: contact });

    if (!user) {
      throw new HttpError.UnprocessableEntity("user-not-found");
    }

    return { user, contact, field };
  }

  private async requestVerify(id: string) {
    if (process.env.NODE_ENV === "development") {
      return Promise.resolve();
    }

    return this.verify.request(id);
  }
}
