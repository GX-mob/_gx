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
import { Account } from "@core/domain/account";
import {
  EAuthorizationNextSteps,
  IAuthCodeResponse,
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
} from "@core/interfaces";
import { AuthRoute } from "@core/routes";
import { Body, Controller, Get, Headers, Ip, Post } from "@nestjs/common";
import { ContactDto, DynamicAuthRequestDto } from "../account.dto";
import { AccountService } from "../account.service";


const signinBasePath = AuthRoute.route("signin").basePath;
const signinStatusPath = AuthRoute.route("signin").route("status", {
  endpointOnly: true,
});
const signinCredentialPath = AuthRoute.route("signin").route("credential", {
  endpointOnly: true,
});
const signinCodePath = AuthRoute.route("signin").route("code", {
  endpointOnly: true,
});

@Controller(signinBasePath)
export class AccountSignInController {
  constructor(
    private accountService: AccountService,
    private authService: AuthService,
  ) {}

  @Get(signinStatusPath)
  async identifyHandler(
    @Body() { contact }: ContactDto,
  ): Promise<IAuthIdentifyResponse> {
    const { password } = await this.accountService.findByContact(contact);

    if (!password) {
      await this.accountService.requestContactVerification(contact);
      return { next: EAuthorizationNextSteps.Code };
    }

    return { next: EAuthorizationNextSteps.Password };
  }

  @Post(signinCredentialPath)
  async passwordHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() authRequest: DynamicAuthRequestDto,
  ): Promise<IAuthPasswordResponse> {
    this.authService.preValidationRequestData(authRequest);

    const accountData = await this.accountService.findByContact(
      authRequest.contact as string,
    );
    await this.authService.authorizeRequest(
      authRequest,
      new Account(accountData),
    );

    if (!accountData["2fa"]) {
      const { token } = await this.authService.create(
        accountData._id,
        userAgent,
        ip,
      );
      return { next: EAuthorizationNextSteps.Authorized, body: { token } };
    }

    const {
      hiddenTarget,
    } = await this.accountService.requestContactVerification(
      accountData["2fa"],
    );
    return {
      next: EAuthorizationNextSteps.Code,
      body: { target: hiddenTarget },
    };
  }

  @Post(signinCodePath)
  async codeHandler(
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
    @Body() authRequest: DynamicAuthRequestDto,
  ): Promise<IAuthCodeResponse> {
    const accountData = await this.accountService.findByContact(
      authRequest.contact as string,
    );
    await this.authService.authorizeRequest(
      authRequest,
      new Account(accountData),
    );

    // await this.usersService.signin(authRequest);
    // await this.usersService.checkContactVerification(contact, verificationCode, verificationRequestId);

    // const user = await this.usersService.findByContact(contact);
    const { token } = await this.authService.create(
      accountData._id,
      userAgent,
      ip,
    );

    return { next: EAuthorizationNextSteps.Authorized, body: { token } };
  }
}
