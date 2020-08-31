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
  UnprocessableEntityException,
  Body,
  Request,
  Response,
  Post,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { DataService } from "@app/data";
import { User } from "@app/database";
import { ContactVerificationService } from "@app/contact-verification";
import { SessionService } from "@app/session";
import { SignInPasswordDto, SignInCodeDto } from "./dto";
import { util } from "@app/helpers";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly data: DataService,
    private readonly verify: ContactVerificationService,
    private readonly session: SessionService,
  ) {}

  @Get(":phone")
  async identify(@Param("phone") phone: string, @Response() res: FastifyReply) {
    const { password, phones, firstName, avatar } = await this.getUser(phone);

    if (!password) {
      await this.requestVerify(phones[0]);
      res.code(202).send({
        firstName,
        avatar,
        last4: phones[0].slice(phones[0].length - 4),
      });

      return;
    }

    return {
      firstName,
      avatar,
    };
  }

  private async getUser(phone: string) {
    console.log("#######", phone);
    const user = await this.data.users.get({ phones: phone });

    if (!user) {
      throw new UnprocessableEntityException("user-not-found");
    }

    return user;
  }

  private async requestVerify(id: string) {
    if (process.env.NODE_ENV === "development") {
      return Promise.resolve();
    }

    return this.verify.request(id);
  }

  @Post("sign-in")
  async signIn(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignInPasswordDto,
  ) {
    const { phone, password } = body;
    const user = await this.getUser(phone);

    await util.assertPassword(
      {
        value: password,
        to: user.password as Buffer,
        be: true,
      },
      "wrong-password",
    );

    if (!user["2fa"]) {
      const { token } = await this.createSession(user, request);

      reply.code(201).send({ token });
      return;
    }

    await this.requestVerify(user["2fa"]);

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
  }

  private async createSession(user: User, request: FastifyRequest) {
    return this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );
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
        const { token } = await this.createSession(user, request);

        reply.code(201).send({ token });
        return;
      }

      throw new UnprocessableEntityException("wrong-code");
    }

    const valid = await this.verify.verify(phone, code);

    if (!valid) {
      throw new UnprocessableEntityException("wrong-code");
    }

    const { token } = await this.createSession(user, request);

    reply.code(201).send({ token });
  }
}
