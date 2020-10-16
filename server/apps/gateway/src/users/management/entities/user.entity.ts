import { Exclude } from "class-transformer";
import { IUser, UserRoles } from "@shared/interfaces";

export class UserEntity implements IUser {
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

  constructor(partial: Partial<IUser>) {
    Object.assign(this, partial);
  }
}
