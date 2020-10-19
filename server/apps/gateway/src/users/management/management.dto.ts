import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  ValidateIf,
} from "class-validator";
import { Exclude } from "class-transformer";
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

export class ContactVerifyRequestDto {
  @IsNotEmpty()
  @IsString()
  contact!: string;
}

export class ConfirmContactVerificationDto {
  @IsNotEmpty()
  @IsString()
  contact!: string;

  @IsNotEmpty()
  @IsNumberString()
  code!: string;
}

export class RemoveContactDto {
  @IsNotEmpty()
  @IsString()
  contact!: string;
}
export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  current!: string;

  @IsNotEmpty()
  @IsNumberString()
  new!: string;
}

export class Enable2FADto {
  @IsNotEmpty()
  @IsString()
  target!: string;
}

export class Disable2FADto {
  @IsNotEmpty()
  @IsString()
  password!: string;
}
