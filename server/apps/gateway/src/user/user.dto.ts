import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateIf,
  IsOptional,
  IsSemVer,
  IsDate,
  IsEnum,
} from "class-validator";
import {
  IAuthPasswordDto,
  IContactDto,
  IContactVerificationCheckDto,
  IUserRegisterDto,
} from "@core/interfaces";
import {
  IAccount,
  EAccountRoles,
  EAccountMode,
  EAvailableCountries,
} from "@core/domain/account";
import { Exclude } from "class-transformer";
import { IVerification } from "@core/domain/verification";

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
  @IsEnum(EAccountMode)
  mode!: EAccountMode;

  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  federalID!: string;

  @IsDate()
  birth!: Date;

  @IsBoolean()
  terms!: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsSemVer()
  termsAcceptedVersion!: string;

  @IsNotEmpty()
  @IsString()
  country!: EAvailableCountries;
}

export class UserDto implements IAccount {
  _id!: string;
  pid!: string;
  mode!: EAccountMode;
  country!: EAvailableCountries;
  accountMode!: EAccountMode;
  firstName!: string;
  lastName!: string;
  primaryEmail!: string;
  secondariesEmails!: string[];
  primaryMobilePhone!: string;
  secondariesMobilePhones!: string[];
  federalID!: string;
  birth!: Date;
  avatar!: string;
  roles!: EAccountRoles[];
  averageEvaluation!: number;
  termsAcceptedVersion!: string;

  @Exclude()
  password!: string;

  @Exclude()
  accountVerifications!: IVerification[];

  constructor(partial: Partial<IAccount>) {
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
  @IsOptional()
  @IsString()
  current?: string;

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
