import { Controller, UseGuards } from "@nestjs/common";
import { DataService } from "@app/data";
import { AuthGuard, AuthorizedRequest } from "@app/auth";

@Controller("account/contact")
@UseGuards(AuthGuard)
export class ContactController {
  constructor(readonly data: DataService) {}
}
