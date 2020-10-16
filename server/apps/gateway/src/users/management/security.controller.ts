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
    await this.usersService.updatePassword(
      request.session.user,
      body.current,
      body.new,
    );
  }

  @Patch("2fa/enable")
  async enable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Enable2FADto,
  ) {
    await this.usersService.enable2FA(request.session.user, body.target);
  }

  @Patch("2fa/disable")
  async disable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Disable2FADto,
  ) {
    await this.usersService.disable2FA(request.session.user, body.password);
  }
}
