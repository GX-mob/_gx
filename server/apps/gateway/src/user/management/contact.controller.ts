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
import { AuthGuard, DUser } from "@app/auth";
import { Account } from "@core/domain/account";
import { ContactDto, ContactVerificationCheckDto } from "../user.dto";
import { UserService } from "../user.service";
import { RemoveContactDto } from "../user.dto";

@Controller("user/contact")
@UseGuards(AuthGuard)
export class UserContactController {
  constructor(private usersService: UserService) {}

  @Get("verify/:contact")
  async verifyContactRequest(@Param() { contact }: ContactDto) {
    await this.usersService.checkInUseContact(contact);
    await this.usersService.requestContactVerification(contact);
  }

  @Put("confirm")
  @HttpCode(201)
  async addContact(
    @DUser() user: Account,
    @Body() { contact, code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.addContact(user, contact, code);
  }

  @Delete()
  async removeContact(
    @DUser() user: Account,
    @Body() { contact, password }: RemoveContactDto,
  ) {
    await this.usersService.removeContact(user, contact, password);
  }
}
