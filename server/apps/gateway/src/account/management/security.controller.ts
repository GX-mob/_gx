import { Controller, UseGuards, Patch, Body } from "@nestjs/common";
import { AccountService } from "../account.service";
import { AuthGuard, DAccount } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto, DynamicAuthRequestDto } from "../account.dto";
import { Account } from "@core/domain/account";

@Controller("user/secutiry")
@UseGuards(AuthGuard)
export class AccountSecurityController {
  constructor(private accountService: AccountService) {}

  @Patch("password")
  async updatePasswordHandler(
    @DAccount() account: Account,
    @Body() updateData: UpdatePasswordDto,
  ) {
    await this.accountService.updatePassword(account, updateData);
  }

  @Patch("2fa/enable")
  async enable2FAHander(
    @DAccount() account: Account,
    @Body() { contact }: Enable2FADto,
  ) {
    await this.accountService.enable2FA(account, contact);
  }

  @Patch("2fa/disable")
  async disable2FAHandler(
    @DAccount() account: Account,
    @Body() authData: DynamicAuthRequestDto,
  ) {
    await this.accountService.disable2FA(account, authData);
  }
}
