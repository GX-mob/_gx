import { Exclude } from "class-transformer";
import { User } from "@app/database";

export class UserEntity implements User {
  _id!: string;
  pid!: string;
  firstName!: string;
  lastName!: string;
  phones!: string[];
  emails!: string[];
  cpf!: string;
  birth!: Date;
  avatar!: string;
  roles!: string[];
  averageEvaluation!: number;

  @Exclude()
  password!: Buffer;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
