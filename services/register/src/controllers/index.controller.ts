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
  CacheService,
  DataService,
  ContactVerificationService,
  SessionService,
} from "@gx-mob/http-service";
import httpErrors from "http-errors";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";

import PhoneRequestBodySchema from "../schemas/phone-request-body.json";
import PhoneVerifyBodySchema from "../schemas/phone-verify-body.json";
import RegisterBodySchema from "../schemas/register-body.json";
import { PhoneVerificationRequestBodySchema as IPhoneRequestBodySchema } from "../types/phone-request-body";
import { PhoneCheckVerificationBodySchema as IPhoneVerifySchema } from "../types/phone-verify-body";
import { RegisterBodySchema as IRegisterBodySchema } from "../types/register-body";

@Controller("/")
export default class PhoneController {
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
    url: "/phone/request",
    options: {
      schema: {
        body: PhoneRequestBodySchema,
        response: {
          "200": {
            ok: { type: "boolean" },
          },
        },
      },
    },
  })
  async requestHandler(
    request: FastifyRequest<{ Body: IPhoneRequestBodySchema }>
  ): Promise<any> {
    const { phone } = request.body;

    if (process.env.NODE_ENV === "development") {
      return { ok: true };
    }

    const previousRequest = await this.cache.get("verifications", phone);

    if (previousRequest && previousRequest.iat + 1000 * 60 < Date.now()) {
      await this.requestVerification(phone);
      return { ok: true };
    }

    // Check if number is already registred
    const exist = await this.data.users.get({ phones: [phone] });

    if (exist) {
      throw new httpErrors.UnprocessableEntity("phone-already-registred");
    }

    await this.requestVerification(phone);

    return { ok: true };
  }

  async requestVerification(phone: string) {
    await this.verify.request(phone);
    await this.cache.set("verifications", phone, { iat: Date.now() });
  }

  @POST({
    url: "/phone/verify",
    options: {
      schema: {
        body: PhoneVerifyBodySchema,
        response: {
          "200": {
            ok: { type: "boolean" },
          },
        },
      },
    },
  })
  async verifyHandler(request: FastifyRequest<{ Body: IPhoneVerifySchema }>) {
    const { phone, code } = request.body;

    if (process.env.NODE_ENV === "development") {
      await this.cache.set("verifications", phone, {
        validated: "000000" === code,
      });
      return { ok: "000000" === code };
    }

    const valid = await this.verify.verify(phone, code);

    if (valid) {
      await this.cache.set("verifications", phone, { validated: true });
      return { ok: true };
    }

    return { ok: false };
  }

  @POST({
    url: "/",
    options: {
      schema: {
        body: RegisterBodySchema,
        response: {
          "200": {
            ok: { type: "boolean" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
              },
            },
          },
        },
      },
    },
  })
  async finishHandler(
    request: FastifyRequest<{ Body: IRegisterBodySchema }>
  ): Promise<any> {
    const { phone, firstName, lastName, cpf, birth, terms } = request.body;

    /**
     * Terms acception
     */
    if (!terms) {
      throw new httpErrors.UnprocessableEntity("terms-not-accepted");
    }

    /**
     * Check number verification
     */
    const verification = await this.cache.get("verifications", phone);

    if (!verification.validated) {
      throw new httpErrors.Unauthorized("phone-not-verified");
    }

    /**
     * Validate CPF
     * * Only on the first ride, the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new httpErrors.UnprocessableEntity("invalid-cpf");
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.data.users.get({ cpf });

    if (registredCPF) {
      throw new httpErrors.UnprocessableEntity("cpf-already-registred");
    }

    const userObject: any = {
      phones: [phone],
      firstName,
      lastName,
      cpf,
      birth: new Date(birth),
    };

    const user = await this.data.users.create(userObject);
    const session = await this.sessions.create(user._id, {
      ua: request.headers["user-agent"],
      ip: request.getRealIp(),
    });

    return {
      ok: true,
      user: {
        id: user._id,
      },
      session: {
        token: session.token,
      },
    };
  }

  /**
   * Prevent expose internal errors
   */
  @ErrorHandler()
  errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    this.instance.log.error(error);

    reply.send(httpErrors(500));
  }
}
