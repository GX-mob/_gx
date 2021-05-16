import {
  Controller,
  UseGuards,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
} from "@nestjs/common";
import { AuthGuard, DAccount } from "@app/auth";
import { Account } from "@core/domain/account";
import { ContactDto, ContactVerificationCheckDto } from "../account.dto";
import { AccountService } from "../account.service";
import { RemoveContactDto } from "../account.dto";
import { IContactVerificationResponseDto } from "@core/interfaces";

@Controller("user/contact")
@UseGuards(AuthGuard)
export class AccountContactController {
  constructor(private usersService: AccountService) {}

  @Get("verify/:contact")
  async verifyContactRequest(
    @Param() { contact }: ContactDto,
  ): Promise<IContactVerificationResponseDto> {
    await this.usersService.checkInUseContact(contact);
    const {
      verificationRequestId,
    } = await this.usersService.requestContactVerification(contact);

    return {
      verificationRequestId,
    };
  }

  @Put("confirm")
  @HttpCode(201)
  async addContact(
    @DAccount() account: Account,
    @Body() { contact, verificationCode: code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.addContact(account, contact, code);
  }

  @Delete()
  async removeContact(
    @DAccount() account: Account,
    @Body() authRequest: RemoveContactDto,
  ) {
    await this.usersService.removeContact(account, authRequest);
  }
}
