// Application Service
import { Injectable } from "@nestjs/common";
import { UserRepository, UserCreateInterface } from "@app/repositories";

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {
  }

  create(data: UserCreateInterface){


    return this.userRepository.create(data);
  }
}
