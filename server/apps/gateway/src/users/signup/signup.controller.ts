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
  Post,
  HttpCode,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { UsersService } from "../users.service";
import { SessionService } from "@app/session";
import { SignUpDto } from "./signup.dto";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";
import { util } from "@app/helpers";
import { ISignUpSuccessResponseDto } from "@shared/interfaces";

@Controller("sign-up")
export class SignUpController {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  @HttpCode(202)
  @Get("verify/:contact")
  async phoneVerificationRequest(@Param() { contact }: ContactDto) {
    await this.usersService.checkInUseContact(contact);
    await this.usersService.requestContactVerify(contact);
  }

  @Post("check")
  async contactVerificationCheck(
    @Body() { contact, code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.verifyContact(contact, code);
  }

  @Post()
  async signUp(
    @Request() request: FastifyRequest,
    @Body() body: SignUpDto,
  ): Promise<ISignUpSuccessResponseDto> {
    const {
      contact,
      code,
      firstName,
      lastName,
      cpf,
      birth,
      terms,
      password,
    } = body;
    /**
     * Ensures security checks
     */
    await this.usersService.checkInUseContact(contact);
    await this.usersService.verifyContact(contact, code);

    const user = await this.usersService.create(
      {
        phones: contact,
        firstName,
        lastName,
        cpf,
        password,
        birth: new Date(birth),
      },
      terms,
    );

    const userAgent = request.headers["user-agent"];
    const ip = util.getClientIp(request.raw);
    const session = await this.sessionService.create(user, userAgent, ip);

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
