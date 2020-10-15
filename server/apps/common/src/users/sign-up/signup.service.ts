import { Injectable } from "@nestjs/common";
import { UsersService } from "../users.service";
import { PhoneRegistredException } from "../exceptions";

@Injectable()
export class SignUpService {
  constructor(private usersService: UsersService) {}

  async checkRegistredPhone(phone: string) {
    const user = await this.usersService.findByPhone(phone);

    if (user) {
      throw new PhoneRegistredException();
    }
  }
}
