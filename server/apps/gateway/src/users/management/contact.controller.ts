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
import {
  ConfirmContactVerificationDto,
  RemoveContactDto,
} from "./management.dto";
import { UsersService } from "../users.service";
import { IUser } from "@shared/interfaces";

@Controller("account/contact")
@UseGuards(AuthGuard)
export class ContactController {
  constructor(private usersService: UsersService) {}

  @Get("verify/:phone")
  @HttpCode(202)
  async verifiContactRequest(@Param() contact: string) {
    await this.usersService.checkInUseContact(contact);
    await this.usersService.requestContactVerify(contact);
  }

  @Put("confirm")
  @HttpCode(201)
  async addContact(
    @User() user: IUser,
    @Body() { contact, code }: ConfirmContactVerificationDto,
  ) {
    await this.usersService.addContact(user, contact, code);
  }

  @Delete()
  async removeContact(
    @User() user: IUser,
    @Body() { contact }: RemoveContactDto,
  ) {
    await this.usersService.removeContact(user, contact);
  }
}
