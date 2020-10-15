import { Injectable } from "@nestjs/common";
import { SessionRepository } from "@app/repositories";
import { SessionInterface } from "@shared/interfaces";
import { UsersService } from "../users.service";
import { UpdateProfileDto } from "./dto";

@Injectable()
export class ManagementService {
  constructor(
    private usersService: UsersService,
    private sessionRepository: SessionRepository,
  ) {}

  async updateAccount(session: SessionInterface, data: UpdateProfileDto) {
    await this.usersService.updateById(session.user._id, data);
    await this.sessionRepository.updateCache({ _id: session._id });
  }
}
