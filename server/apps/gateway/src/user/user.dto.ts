import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateIf,
  IsOptional,
  IsEmail,
  IsMobilePhone,
  IsSemVer
} from "class-validator";
import {
  IAuthPasswordDto,
  IContactDto,
  IContactVerificationCheckDto,
  IUser,
  IUserRegisterDto,
  EUserRoles,
} from "@core/interfaces";
import { Exclude } from "class-transformer";

export class ContactDto implements IContactDto {
  @IsNotEmpty()
  @IsEmail()
  @ValidateIf((o) => !o.mobilePhone)
  email!: string;

  @IsNotEmpty()
  @IsMobilePhone()
  @ValidateIf((o) => !o.email)
  mobilePhone!: string;
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

  @IsDateString()
  birth!: string;

  @IsBoolean()
  terms!: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsSemVer()
  termsAcceptedVersion: string;
}

export class UserDto implements IUser {
  _id!: string;
  pid!: string;
  firstName!: string;
  lastName!: string;
  primaryEmail!: string;
  primaryMobilePhone!: string;
  cpf!: string;
  birth!: Date;
  avatar!: string;
  roles!: EUserRoles[];
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
