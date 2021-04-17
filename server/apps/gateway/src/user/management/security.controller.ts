import { Controller, UseGuards, Patch, Body } from "@nestjs/common";
import { UserService } from "../user.service";
import { AuthGuard, DUser } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto } from "../user.dto";
import { Account } from "@core/domain/account";

@Controller("user/secutiry")
@UseGuards(AuthGuard)
export class UserSecurityController {
  constructor(private usersService: UserService) {}

  @Patch("password")
  async updatePasswordHandler(
    @DUser() user: Account,
    @Body() { current, intended }: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user, intended, current);
  }

  @Patch("2fa/enable")
  async enable2FAHander(
    @DUser() user: Account,
    @Body() { contact }: Enable2FADto,
  ) {
    await this.usersService.enable2FA(user, contact);
  }

  @Patch("2fa/disable")
  async disable2FAHandler(
    @DUser() user: Account,
    @Body() { password }: Disable2FADto,
  ) {
    await this.usersService.disable2FA(user, password);
  }
}
