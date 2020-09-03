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
import {
  Controller,
  Get,
  Param,
  Body,
  Request,
  Response,
  Post,
  UnprocessableEntityException,
  UnauthorizedException,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { DataService } from "@app/data";
import { CacheService } from "@app/cache";
import { SessionService } from "@app/session";
import { ContactVerificationService } from "@app/contact-verification";
import { PhoneVerificationCheckDto, SignUpDto } from "./sign-up.dto";
import { util } from "@app/helpers";
import { EXCEPTIONS_MESSAGES, CACHE_NAMESPACES } from "../constants";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";

@Controller("sign-up")
export class SignUpController {
  constructor(
    readonly cache: CacheService,
    readonly data: DataService,
    readonly contactVerification: ContactVerificationService,
    readonly session: SessionService,
  ) {}

  @Get("verify/phone/:number")
  async phoneVerificationRequest(
    @Response() reply: FastifyReply,
    @Param() phone: string,
  ) {
    await this.checkUser(phone);

    // Prevent resent before expiration
    const previousRequest = await this.getCache(phone);

    /**
     * If haven't a previous request or previous
     * request is expired, requests a new one
     */
    if (!previousRequest || previousRequest.iat + 1000 * 60 < Date.now()) {
      await this.contactVerification.request(phone);
      reply.code(202);
    }

    reply.send();
  }

  @Post("check/phone")
  async phoneVerificationCheck(
    @Response() reply: FastifyReply,
    @Body() body: PhoneVerificationCheckDto,
  ) {
    const { phone, code } = body;
    await this.checkUser(phone);

    const valid = await this.contactVerification.verify(phone, code);

    if (!valid) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    await this.setCache(phone, { code, validated: true });
    reply.code(200);
    reply.send();
    return;
  }

  @Post()
  async signUp(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignUpDto,
  ) {
    const {
      phone,
      code,
      firstName,
      lastName,
      cpf,
      birth,
      terms,
      credential,
    } = body;
    await this.checkUser(phone);

    /**
     * Terms acception
     */
    if (!terms) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED,
      );
    }

    /**
     * Check number verification
     */
    const verification = await this.getCache(phone);

    if (!verification) {
      throw new UnauthorizedException(
        EXCEPTIONS_MESSAGES.VERIFICATION_NOT_FOUND,
      );
    }

    if (!verification.validated) {
      throw new UnauthorizedException(EXCEPTIONS_MESSAGES.PHONE_NOT_VERIFIED);
    }

    if (verification.code !== code) {
      throw new UnauthorizedException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    /**
     * Validate CPF
     * * Only on the first ride the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.INVALID_CPF);
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.data.users.get({ cpf });

    if (registredCPF) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.CPF_REGISTRED);
    }

    const userObject = {
      _id: "asd",
      phones: [phone],
      firstName,
      lastName,
      cpf,
      birth: new Date(birth),
    };

    const user = await this.data.users.create(userObject);
    const session = await this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );

    reply.code(201);
    reply.send({
      user: {
        id: user._id,
      },
      session: {
        token: session.token,
      },
    });
  }

  private async checkUser(phone: string) {
    const user = await this.data.users.get({ phones: phone });

    if (user) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.PHONE_REGISTRED,
      );
    }
  }

  private setCache(key: string, value: any) {
    return this.cache.set(CACHE_NAMESPACES.REGISTRY_VERIFICATIONS, key, value);
  }

  private getCache(key: string) {
    return this.cache.get(CACHE_NAMESPACES.REGISTRY_VERIFICATIONS, key);
  }
}
