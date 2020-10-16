import {
  Controller,
  UseGuards,
  Get,
  Put,
  Delete,
  Request,
  Body,
  Param,
  HttpCode,
} from "@nestjs/common";
import { AuthGuard, AuthorizedRequest } from "@app/auth";
import { ConfirmContactVerificationDto, RemoveContactDto } from "./dto";
import { UsersService } from "../users.service";

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
    @Request() request: AuthorizedRequest,
    @Body() body: ConfirmContactVerificationDto,
  ) {
    await this.usersService.addContact(
      request.session.user,
      body.contact,
      body.code,
    );
  }

  @Delete()
  async removeContact(
    @Request() request: AuthorizedRequest,
    @Body() body: RemoveContactDto,
  ) {
    await this.usersService.removeContact(request.session.user, body.contact);
  }
}
