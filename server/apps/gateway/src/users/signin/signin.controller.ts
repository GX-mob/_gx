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
  Post,
  Ip,
  Headers,
} from "@nestjs/common";
import { ContactDto } from "../users.dto";
import { SignInPasswordDto, SignInCodeDto } from "./signin.dto";
import {
  SignInIdentify,
  SignInPasswordResponse,
  SignInCodeResponse,
} from "@shared/interfaces";
import { SessionService } from "@app/session";
import { UsersService } from "../users.service";

@Controller("signin")
export class SignInController {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  @Get(":contact")
  async identifyHandler(
    @Param() { contact }: ContactDto,
  ): Promise<SignInIdentify> {
    const {
      password,
      firstName,
      avatar,
    } = await this.usersService.findByContact(contact);

    if (!password) {
      await this.usersService.requestContactVerify(contact);
      return { next: "code", body: { firstName, avatar } };
    }

    return { next: "password", body: { firstName, avatar } };
  }

  @Post()
  async passwordHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() { contact, password }: SignInPasswordDto,
  ): Promise<SignInPasswordResponse> {
    const user = await this.usersService.findByContact(contact);

    await this.usersService.assertPassword(user, password);

    if (!user["2fa"]) {
      const { token } = await this.sessionService.create(user, userAgent, ip);
      return { next: "authorized", body: { token } };
    }

    const target = await this.usersService.requestContactVerify(user["2fa"]);
    return { next: "code", body: { target } };
  }

  @Post("code")
  async codeHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() { contact, code }: SignInCodeDto,
  ): Promise<SignInCodeResponse> {
    await this.usersService.verifyContact(contact, code);

    const user = await this.usersService.findByContact(contact);
    const { token } = await this.sessionService.create(user, userAgent, ip);

    return { next: "authorized", body: { token } };
  }
}
