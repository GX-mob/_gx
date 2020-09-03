import {
  Controller,
  UnprocessableEntityException,
  Patch,
  Request,
  Body,
} from "@nestjs/common";
import { User } from "@app/database";
import { DataService } from "@app/data";
import { util } from "@app/helpers";
import { AuthorizedRequest } from "@app/auth";
import { UpdatePasswordDto, Enable2FADto } from "./dto";
import { EXCEPTIONS_MESSAGES } from "../constants";

@Controller("account/secutiry")
export class SecurityController {
  constructor(readonly data: DataService) {}

  @Patch("password")
  async updatePassword(
    @Request() request: AuthorizedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    const { user } = request.session;
    const { current, new: newPassword } = body;

    if (!user.password) {
      this.requestContactVerification();

      return { next: "code" };
    }

    const matchCurrentPassword = await util.assertPassword({
      value: current,
      to: user.password as Buffer,
      be: true,
    });

    if (!matchCurrentPassword) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    const matchToCurrentPassword = await util.assertPassword({
      value: newPassword,
      to: user.password as Buffer,
      be: false,
    });

    if (matchToCurrentPassword) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.UNCHANGED_DATA,
      );
    }

    const password = await util.hashPassword(newPassword);

    await this.data.users.model.updateOne({ _id: user._id }, { password });

    return { next: "ok" };
  }

  @Patch("2fa/enable")
  async enable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Enable2FADto,
  ) {
    const { user } = request.session;

    this.passwordRequired(user);

    const { value: contact } = util.isValidContact(body.target);

    this.hasContact(contact, user);

    await this.data.users.update({ _id: user._id }, { "2fa": contact });
  }

  @Patch("2fa/disable")
  async disable2FA(
    @Request() request: AuthorizedRequest,
    @Body() body: Enable2FADto,
  ) {
    const { user } = request.session;

    this.passwordRequired(user);

    const matchPassword = await util.assertPassword({
      value: body.password,
      to: user.password as Buffer,
      be: true,
    });

    if (!matchPassword) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.WRONG_PASSWORD,
      );
    }

    this.data.users.update({ _id: user._id }, { "2fa": "" });
  }

  private passwordRequired(user: User): void {
    if (!user.password) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.PASSWORD_REQUIRED,
      );
    }
  }

  private hasContact(contact: string, user: User) {
    if (
      !user.phones.includes(contact) &&
      user.emails &&
      !user.emails.includes(contact)
    ) {
      throw new UnprocessableEntityException("not-own-contact");
    }
  }

  private requestContactVerification() {}
}
