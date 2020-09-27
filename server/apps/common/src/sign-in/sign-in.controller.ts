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
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { SignInPasswordDto, SignInCodeDto } from "./sign-in.dto";
import { util } from "@app/helpers";
import {
  UserInterface,
  SignInHttpReponseCodes,
  IdentifyResponseInterface,
  SignInSuccessResponse,
  Password2FARequiredResponse,
} from "@shared/interfaces";
import { UserRepository } from "@app/repositories";
import { ContactVerificationService } from "@app/contact-verification";
import { SessionService } from "@app/session";
import { EXCEPTIONS_MESSAGES } from "../constants";
import validator from "validator";

@Controller("sign-in")
export class SignInController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contactVerification: ContactVerificationService,
    private readonly session: SessionService,
  ) {}

  @Get(":phone")
  async identify(@Response() res: FastifyReply, @Param("phone") phone: string) {
    const { password, phones, firstName, avatar } = await this.getUser(phone);
    let iat: number | undefined;

    if (!password) {
      iat = await this.contactVerification.request(phone);

      res.code(SignInHttpReponseCodes.SecondaFactorRequired);
    }

    res.send<IdentifyResponseInterface>({
      firstName,
      avatar,
      iat,
    });
    return;
  }

  private async getUser(phone: string) {
    const user = await this.userRepository.get({ phones: phone });

    if (!user) {
      throw new NotFoundException(EXCEPTIONS_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  @Post()
  async signIn(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignInPasswordDto,
  ) {
    const { phone, password } = body;
    const user = await this.getUser(phone);

    const result = await util.assertPassword(password, user.password as Buffer);

    if (!result) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    if (!user["2fa"]) {
      const { token } = await this.createSession(user, request);

      reply.code(SignInHttpReponseCodes.Success);
      reply.send<SignInSuccessResponse>({ token });
      return;
    }

    const iat = await this.contactVerification.request(user["2fa"]);

    reply.code(SignInHttpReponseCodes.SecondaFactorRequired);

    const isEmail = validator.isEmail(user["2fa"]);
    const target = isEmail
      ? util.hideEmail(user["2fa"])
      : // Phone last 4 numbers
        user["2fa"].slice(user["2fa"].length - 4);

    reply.send<Password2FARequiredResponse>({
      target,
      iat,
    });
    return;
  }

  @Post("code")
  async code(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignInCodeDto,
  ) {
    const { phone, code } = body;
    const user = await this.getUser(phone);
    const valid = await this.contactVerification.verify(phone, code);

    if (!valid) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    const { token } = await this.createSession(user, request);

    reply.code(SignInHttpReponseCodes.Success);
    reply.send<SignInSuccessResponse>({ token });
    return;
  }

  private createSession(user: UserInterface, request: FastifyRequest) {
    return this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );
  }
}
