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
  HttpCode,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { UsersService } from "../users.service";
import { SignUpService } from "./signup.service";
import { SignUpDto } from "./signup.dto";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";

@Controller("sign-up")
export class SignUpController {
  constructor(
    private usersService: UsersService,
    private signUpService: SignUpService,
  ) {}

  @HttpCode(202)
  @Get("verify/:contact")
  async phoneVerificationRequest(@Param() { contact }: ContactDto) {
    await this.signUpService.checkRegistredPhone(contact);
    await this.usersService.requestContactVerify(contact);
  }

  @Post("check")
  async contactVerificationCheck(
    @Response() reply: FastifyReply,
    @Body() { contact, code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.verifyContact(contact, code);

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
      contact,
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
    await this.signUpService.checkRegistredPhone(contact);
    await this.usersService.verifyContact(contact, code);
    const user = await this.usersService.create(
      {
        phones: contact,
        firstName,
        lastName,
        cpf,
        birth: new Date(birth),
      },
      terms,
    );
    const session = await this.usersService.createSession(user, request);

    return {
      user: {
        id: user._id,
      },
      session: {
        token: session.token,
      },
    };
  }
}
