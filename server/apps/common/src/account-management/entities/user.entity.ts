import { Exclude } from "class-transformer";
import { UserInterface, UserRoles } from "@shared/interfaces";

export class UserEntity implements UserInterface {
  _id!: string;
  pid!: string;
  firstName!: string;
  lastName!: string;
  phones!: string[];
  emails!: string[];
  cpf!: string;
  birth!: Date;
  avatar!: string;
  roles!: UserRoles[];
  averageEvaluation!: number;

  @Exclude()
  password!: string;

  constructor(partial: Partial<UserInterface>) {
    Object.assign(this, partial);
  }
}
