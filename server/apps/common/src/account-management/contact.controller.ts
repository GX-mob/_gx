import {
  Controller,
  UseGuards,
  Get,
  Put,
  Delete,
  Request,
  Body,
  HttpCode,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthGuard, AuthorizedRequest } from "@app/auth";
import { DataService } from "@app/data";
import { ContactVerificationService } from "@app/contact-verification";
import { util } from "@app/helpers";
import { ContactVerifyRequestDto, ConfirmContactVerificationDto } from "./dto";
import { EXCEPTIONS_MESSAGES } from "../constants";

@Controller("account/contact")
@UseGuards(AuthGuard)
export class ContactController {
  constructor(
    readonly data: DataService,
    readonly verify: ContactVerificationService,
  ) {}

  @Get("verify")
  @HttpCode(202)
  async verifiContactRequest(@Body() body: ContactVerifyRequestDto) {
    const { value } = util.isValidContact(body.contact);

    await this.verify.request(value);

    return;
  }

  @Put("confirm")
  @HttpCode(201)
  async addContact(
    @Request() request: AuthorizedRequest,
    @Body() body: ConfirmContactVerificationDto,
  ) {
    const { user } = request.session;
    const { contact, code } = body;
    const { value, field } = util.isValidContact(contact);

    const valid = await this.verify.verify(value, code);

    if (!valid) {
      throw new UnprocessableEntityException(EXCEPTIONS_MESSAGES.WRONG_CODE);
    }

    const update = {
      [field]: [...(user[field] || []), contact],
    };

    await this.data.users.update({ _id: user._id }, update);
  }

  @Delete()
  async removeContact(
    @Request() request: AuthorizedRequest,
    @Body() body: ConfirmContactVerificationDto,
  ) {
    const { user } = request.session;
    const { field, value } = util.isValidContact(body.contact);

    /**
     * Prevent removing the last contact or
     * the second factor authentication
     */
    if (
      [...user.phones, ...(user.emails || [])].length === 1 ||
      user["2fa"] === value
    ) {
      throw new UnprocessableEntityException(
        EXCEPTIONS_MESSAGES.REMOVE_CONTACT_NOT_ALLOWED,
      );
    }

    const updated = [...(user[field] || [])];
    const index = updated.indexOf(value);

    updated.splice(index, 1);

    await this.data.users.update({ _id: user._id }, { [field]: updated });

    return;
  }
}
