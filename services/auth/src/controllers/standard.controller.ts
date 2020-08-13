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
  utils,
} from "@gx-mob/http-service";
import HttpError from "http-errors";
import bcrypt from "bcrypt";

import CredentialsBodySchema from "../schemas/credentials-body.json";
import CodeBodySchema from "../schemas/code-body.json";
import { CredentialsBodySchema as ICredentialsBodySchema } from "../types/credentials-body";
import { CodeBodySchema as ICodeBodySchema } from "../types/code-body";

@Controller("/")
export default class StandardAuthController {
  @Inject(DataService)
  private data!: DataService;

  @Inject(SessionService)
  private session!: SessionService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @GET("/id/:id", {
    schema: {
      response: {
        "200": {
          firstName: { type: "string" },
          avatar: { type: "string" },
          next: { type: "string" },
        },
        "202": {
          firstName: { type: "string" },
          avatar: { type: "string" },
          next: { type: "string" },
          last4: { type: "string" },
        },
      },
    },
  })
  async identifyHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const { password, phones, firstName, avatar } = await this.getUser(id);

    if (!password) {
      await this.requestVerify(phones[0]);
      reply.code(202);

      return {
        firstName,
        avatar,
        next: "code",
        last4: phones[0].slice(phones[0].length - 4),
      };
    }

    return {
      firstName,
      avatar,
      next: "password",
    };
  }

  private async getUser(id: string) {
    const query = this.userQuery(id);
    const user = await this.data.users.get(query);

    if (!user) {
      throw new HttpError.UnprocessableEntity("user-not-found");
    }

    return user;
  }

  private userQuery(id: string): { phones: string } | { emails: string } {
    if (utils.mobileNumberRegex.test(id)) {
      return { phones: id };
    }

    if (utils.emailRegex.test(id)) {
      return { emails: id };
    }

    throw new HttpError.UnprocessableEntity("invalid-id");
  }

  async requestVerify(id: string) {
    if (process.env.NODE_ENV === "development") {
      return Promise.resolve();
    }

    return this.verify.request(id);
  }

  @POST("/sign-in", {
    schema: {
      body: CredentialsBodySchema,
      response: {
        "201": {
          token: { type: "string" },
        },
        "202": {
          next: { type: "string" },
          last4: { type: "string" },
        },
      },
    },
  })
  async credentialHandler(
    request: FastifyRequest<{ Body: ICredentialsBodySchema }>,
    reply: FastifyReply
  ) {
    const { id, credential } = request.body;
    const user = await this.getUser(id);

    const match = await bcrypt.compare(credential, user.password as string);

    if (!match) {
      throw new HttpError.UnprocessableEntity("wrong-password");
    }

    if (user["2fa"]) {
      await this.requestVerify(user["2fa"]);

      reply.code(202);
      return {
        next: "code",
        last4: user["2fa"].slice(user["2fa"].length - 4),
      };
    }

    const { token } = await this.session.create(user, request);

    return reply.code(201).send({ token });
  }

  @POST("/code", {
    schema: {
      body: CodeBodySchema,
      response: {
        "201": {
          token: { type: "string" },
        },
      },
    },
  })
  async codeHandler(
    request: FastifyRequest<{ Body: ICodeBodySchema }>,
    reply: FastifyReply
  ) {
    const { id, code } = request.body;
    const user = await this.getUser(id);

    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        const { token } = await this.session.create(user, request);

        return reply.code(201).send({ token });
      }

      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const valid = await this.verify.verify(id, code);

    if (!valid) {
      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const { token } = await this.session.create(user, request);

    return reply.code(201).send({ token });
  }
}
