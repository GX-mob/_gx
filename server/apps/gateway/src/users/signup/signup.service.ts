import { Injectable } from "@nestjs/common";
import { UsersService } from "../users.service";
import { ContactRegistredException } from "../exceptions";

@Injectable()
export class SignUpService {
  constructor(private usersService: UsersService) {}

  async checkRegistredPhone(contact: string) {
    const user = await this.usersService.findByContact(contact);

    if (user) {
      throw new ContactRegistredException();
    }
  }
}
