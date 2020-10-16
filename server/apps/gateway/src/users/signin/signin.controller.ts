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
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { ContactDto } from "../users.dto";
import { SignInPasswordDto, SignInCodeDto } from "./signin.dto";
import {
  SignInHttpReponseCodes,
  IdentifyResponseInterface,
  SignInSuccessResponse,
  Password2FARequiredResponse,
} from "@shared/interfaces";
import { UsersService } from "../users.service";

@Controller("signin")
export class SignInController {
  constructor(private usersService: UsersService) {}

  @Get(":contact")
  async identify(
    @Response() res: FastifyReply,
    @Param() { contact }: ContactDto,
  ) {
    const user = await this.usersService.findByContact(contact);

    const { password, firstName, avatar } = user;

    if (!password) {
      await this.usersService.requestContactVerify(contact);
      res.code(SignInHttpReponseCodes.SecondaFactorRequired);
    }

    res.send<IdentifyResponseInterface>({
      firstName,
      avatar,
    });
    return;
  }

  @Post("credential")
  async signIn(
    @Request() request: FastifyRequest,
    @Response() reply: FastifyReply,
    @Body() body: SignInPasswordDto,
  ) {
    const { contact, password } = body;
    const user = await this.usersService.findByContact(contact);

    await this.usersService.assertPassword(user, password);

    if (!user["2fa"]) {
      const { token } = await this.usersService.createSession(user, request);

      reply.code(SignInHttpReponseCodes.Success);
      reply.send<SignInSuccessResponse>({ token });
      return;
    }

    const target = await this.usersService.requestContactVerify(contact);

    reply.code(SignInHttpReponseCodes.SecondaFactorRequired);
    reply.send<Password2FARequiredResponse>({
      target,
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
    const user = await this.usersService.findByPhone(phone);

    await this.usersService.verifyContact(phone, code);

    const { token } = await this.usersService.createSession(user, request);

    reply.code(SignInHttpReponseCodes.Success);
    reply.send<SignInSuccessResponse>({ token });
    return;
  }
}
