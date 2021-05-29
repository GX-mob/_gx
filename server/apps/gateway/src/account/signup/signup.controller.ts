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
import { AuthService } from "@app/auth";
import {
  IContactVerificationResponseDto,
  IUserRegisterSuccessDto,
} from "@core/interfaces";
import { AuthRoute } from "@core/routes";
import { Body, Controller, Headers, HttpCode, Ip, Post } from "@nestjs/common";
import {
  ContactDto,
  ContactVerificationCheckDto,
  UserRegisterDto,
} from "../account.dto";
import { AccountService } from "../account.service";

const signupBasePath = AuthRoute.route("signup").basePath;
const signupVerifyPath = AuthRoute.route("signup").route("verify", {
  endpointOnly: true,
});
const signupCheckPath = AuthRoute.route("signup").route("check", {
  endpointOnly: true,
});

@Controller(signupBasePath)
export class AccountSignUpController {
  constructor(
    private usersService: AccountService,
    private sessionService: AuthService,
  ) {}

  @HttpCode(202)
  @Post(signupVerifyPath)
  async phoneVerificationRequest(
    @Body() { contact }: ContactDto,
  ): Promise<IContactVerificationResponseDto> {
    await this.usersService.checkInUseContact(contact);
    const {
      verificationRequestId,
    } = await this.usersService.requestContactVerification(contact);

    return {
      verificationRequestId,
    };
  }

  @Post(signupCheckPath)
  async contactVerificationCheck(
    @Headers("verify-request-id") verifyRequestId: string,
    @Body() { contact, verificationCode: code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.checkContactVerification(
      contact,
      code,
      verifyRequestId,
    );
  }

  @Post()
  async signUp(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() userCreateDto: UserRegisterDto,
  ): Promise<IUserRegisterSuccessDto> {
    const user = await this.usersService.create(userCreateDto);
    const session = await this.sessionService.create(
      user.getID(),
      userAgent,
      ip,
    );

    return {
      user: {
        id: user.getID(),
      },
      session: {
        token: session.token,
      },
    };
  }
}
