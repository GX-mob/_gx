import { Controller, UseGuards, Patch, Body } from "@nestjs/common";
import { AccountService } from "../account.service";
import { AuthGuard, DAccount } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto, DynamicAuthRequestDto } from "../account.dto";
import { Account } from "@core/domain/account";
import { AccountRoute } from "@core/routes";


const basePath = AccountRoute.route("security").basePath;
const passwordPath = AccountRoute.route("security").route("password", {
  endpointOnly: true,
});
const twoFAEnable = AccountRoute.route("security").route("2fa").route("enable", {
  endpointOnly: true
});
const twoFADisable = AccountRoute.route("security").route("2fa").route("disable", {
  endpointOnly: true
});

@Controller(basePath)
@UseGuards(AuthGuard)
export class AccountSecurityController {
  constructor(private accountService: AccountService) {}

  @Patch(passwordPath)
  async updatePasswordHandler(
    @DAccount() account: Account,
    @Body() updateData: UpdatePasswordDto,
  ) {
    await this.accountService.updatePassword(account, updateData);
  }

  @Patch(twoFAEnable)
  async enable2FAHander(
    @DAccount() account: Account,
    @Body() { contact }: Enable2FADto,
  ) {
    await this.accountService.enable2FA(account, contact);
  }

  @Patch(twoFADisable)
  async disable2FAHandler(
    @DAccount() account: Account,
    @Body() authData: DynamicAuthRequestDto,
  ) {
    await this.accountService.disable2FA(account, authData);
  }
}
