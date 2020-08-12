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
import { Controller, POST, Inject, ErrorHandler } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  DataService,
  ContactVerificationService,
  SessionService,
  HandleError,
  utils,
} from "@gx-mob/http-service";
import HttpError from "http-errors";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";

import PhoneRequestBodySchema from "../schemas/phone-request-body.json";
import PhoneVerifyBodySchema from "../schemas/phone-verify-body.json";
import RegisterBodySchema from "../schemas/register-body.json";
import { PhoneVerificationRequestBodySchema as IPhoneRequestBodySchema } from "../types/phone-request-body";
import { PhoneCheckVerificationBodySchema as IPhoneVerifySchema } from "../types/phone-verify-body";
import { RegisterBodySchema as IRegisterBodySchema } from "../types/register-body";

@Controller("/")
export default class StandardRegisterController {
  @Inject(DataService)
  private data!: DataService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @Inject(SessionService)
  private session!: SessionService;

  @ErrorHandler()
  private errorHandler(
    error: Error,
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    HandleError(error, reply);
  }

  @POST({
    url: "/phone/request",
    options: {
      schema: {
        body: PhoneRequestBodySchema,
      },
    },
  })
  async requestHandler(
    request: FastifyRequest<{ Body: IPhoneRequestBodySchema }>,
    reply: FastifyReply
  ): Promise<any> {
    const phone = this.phone(request.body);

    const user = await this.data.users.get({ phones: phone });

    if (user) {
      throw new HttpError.UnprocessableEntity("phone-already-registred");
    }

    if (process.env.NODE_ENV === "development") {
      return reply.code(202).send();
    }

    // Prevent resent before expiration
    const previousRequest = await this.getCache(phone);

    /**
     * If haven't a previous request or previous
     * request is expired, requests a new one
     */
    if (!previousRequest || previousRequest.iat + 1000 * 60 < Date.now()) {
      await this.requestVerification(phone);
      reply.code(202);
    }

    return reply.send();
  }

  /**
   * If pass contact like object makes full number and validate it,
   * else validates contact like as email
   * @param value
   * @throws UnprocessableEntity: invalid-number
   * @return {object} { contact: string, type: "email" | "phone" }
   */
  private phone(
    value: { cc: string; phone: string } | string
  ): { contact: string; type: "email" | "phone" } {
    const type = typeof value === "string" ? "email" : "phone";

    value = typeof value === "string" ? value : `${value.cc}${value.phone}`;

    const regex = type === "phone" ? utils.mobileNumberRegex : utils.emailRegex;

    if (!regex.test(value)) {
      throw new HttpError.UnprocessableEntity("invalid-contact");
    }

    return { contact: value, type };
  }

  async requestVerification(phone: string) {
    await this.verify.request(phone);
    await this.setCache(phone, { iat: Date.now() });
  }

  @POST({
    url: "/phone/verify",
    options: {
      schema: {
        body: PhoneVerifyBodySchema,
      },
    },
  })
  async verifyHandler(
    request: FastifyRequest<{ Body: IPhoneVerifySchema }>,
    reply: FastifyReply
  ) {
    const { code } = request.body;
    const phone = this.phone(request.body);

    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        await this.setCache(phone, {
          code: "000000",
          validated: true,
        });

        return reply.code(200).send();
      }

      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const valid = await this.verify.verify(phone, code);

    if (!valid) {
      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    await this.setCache(phone, { code, validated: true });
    return reply.code(200).send();
  }

  @POST({
    url: "/sign-up",
    options: {
      schema: {
        body: RegisterBodySchema,
        response: {
          "201": {
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
              },
            },
            session: {
              type: "object",
              properties: {
                token: { type: "string" },
              },
            },
          },
        },
      },
    },
  })
  async finishHandler(
    request: FastifyRequest<{ Body: IRegisterBodySchema }>,
    reply: FastifyReply
  ): Promise<any> {
    const { code, firstName, lastName, cpf, birth, terms } = request.body;
    const phone = this.phone(request.body);

    /**
     * Terms acception
     */
    if (!terms) {
      throw new HttpError.UnprocessableEntity("terms-not-accepted");
    }

    /**
     * Check number verification
     */
    const verification = await this.getCache(phone);

    if (!verification?.validated || verification?.code !== code) {
      throw new HttpError.Unauthorized("phone-verification-failed");
    }

    /**
     * Validate CPF
     * * Only on the first ride, the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new HttpError.UnprocessableEntity("invalid-cpf");
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.data.users.get({ cpf });

    if (registredCPF) {
      throw new HttpError.UnprocessableEntity("cpf-already-registred");
    }

    const userObject: any = {
      phones: [phone],
      firstName,
      lastName,
      cpf,
      birth: new Date(birth),
    };

    const user = await this.data.users.create(userObject);
    const session = await this.session.create(user, request);

    reply.code(201);

    return {
      user: {
        id: user._id,
      },
      session: {
        token: session.token,
      },
    };
  }

  private setCache(key: string, value: any) {
    return this.data.cache.set("registryVerifications", key, value);
  }

  private getCache(key: string) {
    return this.data.cache.get("registryVerifications", key);
  }
}
