import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from "class-validator";
import {
  IAuthPasswordDto,
  IContactDto,
  IContactVerificationCheckDto,
  IUser,
  IUserRegisterDto,
  UserRoles,
} from "@shared/interfaces";
import { Exclude } from "class-transformer";

export class ContactDto implements IContactDto {
  @IsNotEmpty()
  @IsString()
  contact!: string;
}

export class ContactVerificationCheckDto
  extends ContactDto
  implements IContactVerificationCheckDto {
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class AuthPasswordDto extends ContactDto implements IAuthPasswordDto {
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class UserRegisterDto
  extends ContactVerificationCheckDto
  implements IUserRegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @IsNotEmpty()
  @IsDateString()
  birth!: string;

  @IsNotEmpty()
  @IsBoolean()
  terms!: boolean;

  @IsString()
  password?: string;
}

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
