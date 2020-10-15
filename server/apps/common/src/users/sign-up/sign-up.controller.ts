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
import { PhoneVerificationCheckDto, SignUpDto } from "./sign-up.dto";
import { UsersService } from "../users.service";
import { SignUpService } from "./signup.service";

@Controller("sign-up")
export class SignUpController {
  constructor(
    private usersService: UsersService,
    private signUpService: SignUpService,
  ) {}

  @Get("verify/:number")
  async phoneVerificationRequest(
    @Response() reply: FastifyReply,
    @Param() phone: string,
  ) {
    await this.signUpService.checkRegistredPhone(phone);
    await this.usersService.requestContactVerify(phone);

    reply.code(202);
    reply.send();
  }

  @Post("check")
  async phoneVerificationCheck(
    @Response() reply: FastifyReply,
    @Body() body: PhoneVerificationCheckDto,
  ) {
    const { phone, code } = body;
    await this.usersService.verifyContact(phone, code);

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
    /**
     * Ensures security checks
     */
    await this.signUpService.checkRegistredPhone(phone);
    await this.usersService.verifyContact(phone, code);
    const user = await this.usersService.create(
      {
        phones: phone,
        firstName,
        lastName,
        cpf,
        birth: new Date(birth),
      },
      terms,
    );
    const session = await this.usersService.createSession(user, request);

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
}
