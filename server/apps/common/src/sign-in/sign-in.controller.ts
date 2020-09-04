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
import { User } from "@app/database";
import { DataService } from "@app/data";
import { ContactVerificationService } from "@app/contact-verification";
import { SessionService } from "@app/session";
import { EXCEPTIONS_MESSAGES } from "../constants";

@Controller("sign-in")
export class SignInController {
  constructor(
    private readonly data: DataService,
    private readonly contactVerification: ContactVerificationService,
    private readonly session: SessionService,
  ) {}

  @Get(":phone")
  async identify(@Response() res: FastifyReply, @Param("phone") phone: string) {
    const { password, phones, firstName, avatar } = await this.getUser(phone);

    if (!password) {
      await this.contactVerification.request(phones[0]);
      res.code(202);
      res.send({
        firstName,
        avatar,
        last4: phones[0].slice(phones[0].length - 4),
      });
      return;
    }

    res.send({
      firstName,
      avatar,
    });
    return;
  }

  private async getUser(phone: string) {
    const user = await this.data.users.get({ phones: phone });

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

      reply.code(201);
      reply.send({ token });
      return;
    }

    await this.contactVerification.request(user["2fa"]);

    reply.code(202);

    const isEmail = util.emailRegex.test(user["2fa"]);

    if (isEmail) {
      const [name, domain] = user["2fa"].split("@");
      const hiddenEmail = `${name
        .slice(0, 3)
        .padEnd(name.length, "*")}@${domain}`;

      reply.send({
        target: hiddenEmail,
      });
      return;
    }

    const last4PhoneNumbers = user["2fa"].slice(user["2fa"].length - 4);

    reply.send({
      target: last4PhoneNumbers,
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

    reply.code(201);
    reply.send({ token });
    return;
  }

  private createSession(user: User, request: FastifyRequest) {
    return this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );
  }
}
