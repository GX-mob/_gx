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
import {
  ContactDto,
  ContactVerificationCheckDto,
  AuthPasswordDto,
} from "../user.dto";
import {
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
  IAuthCodeResponse,
  EAuthorizationNextSteps,
} from "@core/interfaces";
import { AuthService } from "@app/auth";
import { UserService } from "../user.service";
import { AccountSecurity } from "@core/domain/account";

@Controller("user/auth")
export class UserAuthController {
  constructor(
    private usersService: UserService,
    private sessionService: AuthService,
  ) {}

  @Get("status")
  async identifyHandler(
    @Body() { contact }: ContactDto,
  ): Promise<IAuthIdentifyResponse> {
    const { password } = await this.usersService.findByContact(contact);

    if (!password) {
      await this.usersService.requestContactVerification(contact);
      return { next: EAuthorizationNextSteps.Code };
    }

    return { next: EAuthorizationNextSteps.Password };
  }

  @Post("credential")
  async passwordHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() { contact, password }: AuthPasswordDto,
  ): Promise<IAuthPasswordResponse> {
    const userData = await this.usersService.findByContact(contact);
    const userSecurity = new AccountSecurity(userData);
    
    await userSecurity.assertPassword(password);

    if (!userData["2fa"]) {
      const { token } = await this.sessionService.create(userData._id, userAgent, ip);
      return { next: EAuthorizationNextSteps.Authorized, body: { token } };
    }

    const target = await this.usersService.requestContactVerification(userData["2fa"]);
    return { next: EAuthorizationNextSteps.Code, body: { target } };
  }

  @Post("code")
  async codeHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() { contact, code }: ContactVerificationCheckDto,
  ): Promise<IAuthCodeResponse> {
    await this.usersService.checkContactVerification(contact, code);

    const user = await this.usersService.findByContact(contact);
    const { token } = await this.sessionService.create(user._id, userAgent, ip);

    return { next: EAuthorizationNextSteps.Authorized, body: { token } };
  }
}
