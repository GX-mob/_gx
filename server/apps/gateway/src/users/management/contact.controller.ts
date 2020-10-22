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
import { AuthGuard, User } from "@app/auth";
import { IUser } from "@shared/interfaces";
import { ContactDto, ContactVerificationCheckDto } from "../users.dto";
import { UsersService } from "../users.service";
import { RemoveContactDto } from "./management.dto";

@Controller("account/contact")
@UseGuards(AuthGuard)
export class ContactController {
  constructor(private usersService: UsersService) {}

  @Get("verify/:contact")
  async verifyContactRequest(@Param() { contact }: ContactDto) {
    await this.usersService.checkInUseContact(contact);
    await this.usersService.requestContactVerify(contact);
  }

  @Put("confirm")
  @HttpCode(201)
  async addContact(
    @User() user: IUser,
    @Body() { contact, code }: ContactVerificationCheckDto,
  ) {
    await this.usersService.addContact(user, contact, code);
  }

  @Delete()
  async removeContact(
    @User() user: IUser,
    @Body() { contact, password }: RemoveContactDto,
  ) {
    await this.usersService.removeContact(user, contact, password);
  }
}
