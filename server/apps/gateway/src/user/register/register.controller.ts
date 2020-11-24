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
  HttpCode,
  Ip,
  Headers,
} from "@nestjs/common";
import { UserService } from "../user.service";
import { AuthService } from "@app/auth";
import {
  ContactDto,
  ContactVerificationCheckDto,
  UserRegisterDto,
} from "../user.dto";
import { IUserRegisterSuccessDto } from "@shared/interfaces";

@Controller("user/register")
export class UserRegisterController {
  constructor(
    private usersService: UserService,
    private sessionService: AuthService,
  ) {}

  @HttpCode(202)
  @Post("verify")
  async phoneVerificationRequest(@Body() { contact }: ContactDto) {
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
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() body: UserRegisterDto,
  ): Promise<IUserRegisterSuccessDto> {
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
        birth: new Date(birth),
        ...(password ? { password } : {}),
      },
      terms,
    );

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
