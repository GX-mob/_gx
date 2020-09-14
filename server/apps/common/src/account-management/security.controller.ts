import {
  Controller,
  UnprocessableEntityException,
  Patch,
  Request,
  Body,
} from "@nestjs/common";
import { User, UserRepository } from "@app/repositories";
import { util } from "@app/helpers";
import { AuthorizedRequest } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto, Disable2FADto } from "./dto";
import { EXCEPTIONS_MESSAGES } from "../constants";

@Controller("account/secutiry")
export class AccountSecurityController {
  constructor(readonly userRepository: UserRepository) {}

  @Patch("password")
  async updatePassword(
    @Request() request: AuthorizedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    const { user } = request.session;
    const { current, new: newPassword } = body;

    if (!user.password) {
      const password = await util.hashPassword(newPassword);

      await this.userRepository.model.updateOne(
        { _id: user._id },
        { password },
      );

      return;
    }

    const currentPasswordCompare = await util.assertPassword(
      current,
      user.password,
    );

    if (!currentPasswordCompare) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    const matchToCurrentPassword = await util.assertPassword(
      newPassword,
      user.password,
    );

    if (matchToCurrentPassword) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.UNCHANGED_DATA,
      );
    }

    const password = await util.hashPassword(newPassword);

    await this.userRepository.model.updateOne({ _id: user._id }, { password });

    return;
  }

  @Patch("2fa/enable")
  async enable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Enable2FADto,
  ) {
    const { user } = request.session;

    this.passwordRequired(user);

    const { value: contact } = util.isValidContact(body.target);

    if (!user.phones.includes(contact) && !user.emails.includes(contact)) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.NOT_OWN_CONTACT,
      );
    }

    await this.userRepository.update({ _id: user._id }, { "2fa": contact });
  }

  @Patch("2fa/disable")
  async disable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Disable2FADto,
  ) {
    const { user } = request.session;

    this.passwordRequired(user);

    const matchPassword = await util.assertPassword(
      body.password,
      user.password as Buffer,
    );

    if (!matchPassword) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    this.userRepository.update({ _id: user._id }, { "2fa": "" });
  }

  private passwordRequired(user: User): void {
    if (!user.password) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED,
      );
    }
  }
}
