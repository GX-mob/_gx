import { Controller, UseGuards, Patch, Body } from "@nestjs/common";
import { UsersService } from "../users.service";
import { AuthGuard, User } from "@app/auth";
import { UserRepository } from "@app/repositories";
import {
  UpdatePasswordDto,
  Enable2FADto,
  Disable2FADto,
} from "./management.dto";
import { IUser } from "@shared/interfaces";

@Controller("account/secutiry")
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(
    private usersService: UsersService,
    readonly userRepository: UserRepository,
  ) {}

  @Patch("password")
  async updatePassword(@User() user: IUser, @Body() body: UpdatePasswordDto) {
    await this.usersService.updatePassword(user, body.current, body.new);
  }

  @Patch("2fa/enable")
  async enable2FA(@User() user: IUser, @Body() body: Enable2FADto) {
    await this.usersService.enable2FA(user, body.target);
  }

  @Patch("2fa/disable")
  async disable2FA(@User() user: IUser, @Body() body: Disable2FADto) {
    await this.usersService.disable2FA(user, body.password);
  }
}
