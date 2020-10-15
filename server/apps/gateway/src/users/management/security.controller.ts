import { Controller, Patch, Request, Body } from "@nestjs/common";
import { UsersService } from "../users.service";
import { UserRepository } from "@app/repositories";
import { AuthorizedRequest } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto } from "./dto";

@Controller("account/secutiry")
export class SecurityController {
  constructor(
    private usersService: UsersService,
    readonly userRepository: UserRepository,
  ) {}

  @Patch("password")
  async updatePassword(
    @Request() request: AuthorizedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    const { user } = request.session;
    const { current, new: newPassword } = body;

    return this.usersService.updatePassword(user, current, newPassword);
  }

  @Patch("2fa/enable")
  enable2FA(@Request() request: AuthorizedRequest, @Body() body: Enable2FADto) {
    const { user } = request.session;

    this.usersService.enable2FA(user, body.target);
  }

  @Patch("2fa/disable")
  disable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Disable2FADto,
  ) {
    const { user } = request.session;

    this.usersService.disable2FA(user, body.password);
  }
}
