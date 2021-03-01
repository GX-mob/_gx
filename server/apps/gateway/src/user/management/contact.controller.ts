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
import { IUser } from "@core/domain/user";
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
