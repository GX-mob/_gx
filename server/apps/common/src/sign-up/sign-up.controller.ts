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
import { UserRepository, UserCreateInterface } from "@app/repositories";
import { CacheService } from "@app/cache";
import { SessionService } from "@app/session";
import { ContactVerificationService } from "@app/contact-verification";
import { PhoneVerificationCheckDto, SignUpDto } from "./sign-up.dto";
import { util } from "@app/helpers";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { CACHE_NAMESPACES } from "../constants";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";

@Controller("sign-up")
export class SignUpController {
  constructor(
    readonly cache: CacheService,
    readonly userRepository: UserRepository,
    readonly contactVerification: ContactVerificationService,
    readonly session: SessionService,
  ) {}

  @Get("verify/:number")
  async phoneVerificationRequest(
    @Response() reply: FastifyReply,
    @Param() phone: string,
  ) {
    await this.checkUser(phone);
    await this.contactVerification.request(phone);

    reply.code(202);
    reply.send();
  }

  @Post("check")
  async phoneVerificationCheck(
    @Response() reply: FastifyReply,
    @Body() body: PhoneVerificationCheckDto,
  ) {
    const { phone, code } = body;
    await this.checkUser(phone);

    const valid = await this.contactVerification.verify(phone, code);

    if (!valid) {
      throw new UnprocessableEntityException(
        HTTP_EXCEPTIONS_MESSAGES.WRONG_CODE,
      );
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
        HTTP_EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED,
      );
    }

    /**
     * Check number verification
     */
    const verification = await this.contactVerification.verify(phone, code);

    if (!verification) {
      throw new UnauthorizedException(
        HTTP_EXCEPTIONS_MESSAGES.PHONE_NOT_VERIFIED,
      );
    }

    /**
     * Validate CPF
     * * Only on the first ride the CPF is consulted with the government api
     */
    if (!isValidCPF(cpf)) {
      throw new UnprocessableEntityException(
        HTTP_EXCEPTIONS_MESSAGES.INVALID_CPF,
      );
    }

    /**
     * Check if CPF is already registred
     */
    const registredCPF = await this.userRepository.get({ cpf });

    if (registredCPF) {
      throw new UnprocessableEntityException(
        HTTP_EXCEPTIONS_MESSAGES.CPF_REGISTRED,
      );
    }

    const userObject: UserCreateInterface = {
      phones: [phone],
      firstName,
      lastName,
      cpf,
      birth: new Date(birth),
    };

    const user = await this.userRepository.create(userObject);
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
    const user = await this.userRepository.get({ phones: phone });

    if (user) {
      throw new UnprocessableEntityException(
        HTTP_EXCEPTIONS_MESSAGES.PHONE_REGISTRED,
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
