import { Controller, UseGuards, Patch, Body } from "@nestjs/common";
import { UsersService } from "../users.service";
import { AuthGuard, User } from "@app/auth";
import {
  UpdatePasswordDto,
  Enable2FADto,
  Disable2FADto,
} from "./management.dto";
import { IUser } from "@shared/interfaces";

@Controller("account/secutiry")
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(private usersService: UsersService) {}

  @Patch("password")
  async updatePasswordHandler(
    @User() user: IUser,
    @Body() { current, intended }: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user, current, intended);
  }

  @Patch("2fa/enable")
  async enable2FAHander(
    @User() user: IUser,
    @Body() { contact }: Enable2FADto,
  ) {
    await this.usersService.enable2FA(user, contact);
  }

  @Patch("2fa/disable")
  async disable2FAHandler(
    @User() user: IUser,
    @Body() { password }: Disable2FADto,
  ) {
    await this.usersService.disable2FA(user, password);
  }
}
