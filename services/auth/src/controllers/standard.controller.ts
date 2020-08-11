/*
  GX - Corridas
  Copyright (C) 2020  Fernando Costa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Controller, GET, POST } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import { ControllerAugment } from "@gx-mob/http-service";
import {
  isValidMobilePhone,
  isValidEmail,
  isValidCPF,
} from "@brazilian-utils/brazilian-utils";
import HttpErrors from "http-errors";
import bcrypt from "bcrypt";
import { getClientIp } from "request-ip";

import CredentialsBodySchema from "../schemas/credentials-body.json";
import CodeBodySchema from "../schemas/code-body.json";
import { CredentialsBodySchema as ICredentialsBodySchema } from "../types/credentials-body";
import { CodeBodySchema as ICodeBodySchema } from "../types/code-body";

@Controller("/")
export default class StandardAuthController extends ControllerAugment {
  public settings = {
    protected: false,
    managedErrors: ["UnprocessableEntityError", "UnauthorizedError"],
  };

  @GET({
    url: "/id/:id",
    options: {
      schema: {
        response: {
          "200": {
            id: { type: "string" },
            avatar: { type: "string" },
            next: { type: "string" },
          },
          "201": {
            id: { type: "string" },
            avatar: { type: "string" },
            next: { type: "string" },
            last4: { type: "string" },
          },
        },
      },
    },
  })
  async identifyHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const user = await this.getUser(id);

    if (!user.credential) {
      await this.requestVerify(user.phones[0]);
      reply.code(201);

      return {
        id: user._id,
        avatar: user.avatar,
        next: "code",
        last4: user.phones[0].slice(user.phones[0].length - 4),
      };
    }

    return {
      id: user._id,
      avatar: user.avatar,
      next: "credential",
    };
  }

  private async getUser(id: string) {
    const query = this.userQuery(id);
    const user = await this.data.users.get(query);

    if (!user) {
      throw new HttpErrors.UnprocessableEntity("user-not-found");
    }

    return user;
  }

  private userQuery(
    id: string
  ): { phones: string } | { emails: string } | { cpf: string } {
    if (isValidMobilePhone(id)) {
      return { phones: `+55${id}` };
    }

    if (isValidEmail(id)) {
      return { emails: id };
    }

    if (isValidCPF(id)) {
      return { cpf: id };
    }

    throw new HttpErrors.UnprocessableEntity("invalid-id");
  }

  async requestVerify(id: string) {
    if (process.env.NODE_ENV === "development") {
      return Promise.resolve();
    }

    return this.verify.request(id);
  }

  @POST({
    url: "/credential",
    options: {
      schema: {
        body: CredentialsBodySchema,
        response: {
          "200": {
            token: { type: "string" },
          },
          "201": {
            next: { type: "string" },
            last4: { type: "string" },
          },
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

    const match = await bcrypt.compare(credential, user.credential);

    if (!match) {
      throw new HttpErrors.UnprocessableEntity("wrong-credential");
    }

    if (user["2fa"]) {
      await this.requestVerify(user["2fa"]);

      reply.code(201);
      return {
        next: "code",
        last4: user["2fa"].slice(user["2fa"].length - 4),
      };
    }

    const { token } = await this.createSession(user._id, request);

    return { token };
  }

  private createSession(userId: string, request: FastifyRequest) {
    return this.session.create(userId, {
      ua: request.headers["user-agent"],
      ip: getClientIp(request.raw),
    });
  }

  @POST({
    url: "/code",
    options: {
      schema: {
        body: CodeBodySchema,
        response: {
          "200": {
            token: { type: "string" },
          },
        },
      },
    },
  })
  async codeHandler(request: FastifyRequest<{ Body: ICodeBodySchema }>) {
    const { id, code } = request.body;
    const user = await this.getUser(id);

    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        const { token } = await this.createSession(user._id, request);

        return { token };
      }

      throw new HttpErrors.UnprocessableEntity("wrong-code");
    }

    const valid = await this.verify.verify(id, code);

    if (!valid) {
      throw new HttpErrors.UnprocessableEntity("wrong-code");
    }

    const { token } = await this.createSession(user._id, request);

    return { token };
  }
}
