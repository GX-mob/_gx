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
import { SignInPasswordDto, SignInCodeDto } from "./auth.dto";
import { util } from "@app/helpers";
import { AuthService } from "./auth.service";
import { EXCEPTIONS_MESSAGES } from "./constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get(":phone")
  async identify(@Response() res: FastifyReply, @Param("phone") phone: string) {
    const { password, phones, firstName, avatar } = await this.getUser(phone);

    if (!password) {
      await this.service.createVerification(phones[0]);
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
    const user = await this.service.getUser(phone);

    if (!user) {
      throw new NotFoundException(EXCEPTIONS_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  @Post("sign-in")
  async signIn(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignInPasswordDto,
  ) {
    const { phone, password } = body;
    const user = await this.getUser(phone);

    const result = await util.assertPassword({
      value: password,
      to: user.password as Buffer,
      be: true,
    });

    if (!result) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    if (!user["2fa"]) {
      const { token } = await this.service.createSession(user, request);

      reply.code(201);
      reply.send({ token });
      return;
    }

    await this.service.createVerification(user["2fa"]);

    reply.code(202);

    if (util.emailRegex.test(user["2fa"])) {
      const [name, domain] = user["2fa"].split("@");
      reply.send({
        target: `${name.slice(0, 3).padEnd(name.length, "*")}@${domain}`,
      });
      return;
    }
    reply.send({
      target: user["2fa"].slice(user["2fa"].length - 4),
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

    if (process.env.NODE_ENV === "development") {
      if ("000000" === code) {
        const { token } = await this.service.createSession(user, request);

        reply.code(201);
        reply.send({ token });
        return;
      }

      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    const valid = await this.service.checkVerification(phone, code);

    if (!valid) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    const { token } = await this.service.createSession(user, request);

    reply.code(201);
    reply.send({ token });
    return;
  }
}
