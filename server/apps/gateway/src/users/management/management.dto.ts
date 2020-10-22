import { IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { Exclude } from "class-transformer";
import { ContactDto } from "../users.dto";
import { IUser, UserRoles } from "@shared/interfaces";

export class UserDto implements IUser {
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

export class UpdateProfileDto {
  @ValidateIf((o) => !o.lastName)
  @IsNotEmpty()
  @IsString()
  firstName?: string;

  @ValidateIf((o) => !o.firstName)
  @IsNotEmpty()
  @IsString()
  lastName?: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  current!: string;

  @IsNotEmpty()
  @IsString()
  intended!: string;
}

export class Enable2FADto extends ContactDto {}

export class Disable2FADto {
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class RemoveContactDto extends ContactDto {
  @IsNotEmpty()
  @IsString()
  password!: string;
}
