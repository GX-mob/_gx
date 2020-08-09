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

import {
  Controller,
  Inject,
  POST,
  ErrorHandler,
  FastifyInstanceToken,
} from "fastify-decorators";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  // Services
  CacheService,
  DataService,
  ContactVerificationService,
  SessionService,

  // Helpers
  utils,
} from "@gx-mob/http-service";
import {
  isValidMobilePhone,
  isValidEmail,
  isValidCPF,
} from "@brazilian-utils/brazilian-utils";
import httpErrors from "http-errors";
import bcrypt from "bcrypt";
import { getClientIp } from "request-ip";

import IdentifyBodySchema from "../schemas/identify-body.json";
import AuthenticateBodySchema from "../schemas/authenticate-body.json";
import { IdentifyBodySchema as IIdentifyBodySchema } from "../types/identify-body";
import { AuthenticateBodySchema as IAuthenticateBodySchema } from "../types/authenticate-body";

@Controller("/credential")
export default class StandardAuthCotnroller {
  private managedErrors = ["UnprocessableEntityError", "UnauthorizedError"];

  @Inject(FastifyInstanceToken)
  private instance!: FastifyInstance;

  @Inject(CacheService)
  private cache!: CacheService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @Inject(DataService)
  private data!: DataService;

  @Inject(SessionService)
  private sessions!: SessionService;

  @POST({
    url: "/identify",
    options: {
      schema: {
        body: IdentifyBodySchema,
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
          },
        },
      },
    },
  })
  async identify(
    request: FastifyRequest<{ Body: IIdentifyBodySchema }>,
    reply: FastifyReply
  ) {
    const { id } = request.body;
    const user = await this.getUser(id);

    if (!user) {
      throw new httpErrors.UnprocessableEntity("not-found");
    }

    if (!user.credential) {
      await this.verify.request(user.phones[0]);

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

  private getUser(id: string) {
    const key = this.getIdKey(id);

    return this.data.users.get({ [key]: id });
  }

  private getIdKey(id: string): "phones" | "emails" | "cpf" {
    if (isValidMobilePhone(id)) {
      return "phones";
    }

    if (isValidEmail(id)) {
      return "emails";
    }

    if (isValidCPF(id)) {
      return "cpf";
    }

    throw new httpErrors.UnprocessableEntity("invalid-id");
  }

  @POST({
    url: "/authenticate",
    options: {
      schema: {
        body: AuthenticateBodySchema,
      },
    },
  })
  async authenticate(
    request: FastifyRequest<{ Body: IAuthenticateBodySchema }>,
    reply: FastifyReply
  ) {
    const { id, credential } = request.body;
    const user = await this.getUser(id);

    const match = await bcrypt.compare(credential, user.credential);

    if (!match) {
      throw new httpErrors.UnprocessableEntity("wrong-credential");
    }

    const { token } = await this.sessions.create(user._id, {
      ua: request.headers["user-agent"],
      ip: getClientIp(request.raw),
    });

    return { token };
  }

  /**
   * Prevent expose internal errors
   */
  @ErrorHandler()
  errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    utils.manageControllerError(
      this.managedErrors,
      error,
      reply,
      this.instance.log
    );
  }
}
