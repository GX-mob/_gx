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
  IDynamicAuthRequestDto,
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
  verificationCode!: string;

  @IsNotEmpty()
  @IsString()
  verificationRequestId!: string;
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

export class Enable2FADto extends ContactDto {}

export class Disable2FADto implements Partial<IContactVerificationCheckDto> {
  @IsString()
  password?: string;

  @IsString()
  contact?: string;

  @IsString()
  verificationCode?: string;
}

export class DynamicAuthRequestDto implements IDynamicAuthRequestDto {
  @ValidateIf(
    (o) => !o.contact && o.contact && !o.verificationCode && !o.verificationId,
  )
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ValidateIf((o) => !o.password)
  @IsString()
  @IsNotEmpty()
  contact?: string;

  @ValidateIf((o) => !o.password)
  @IsString()
  @IsNotEmpty()
  verificationCode?: string;

  @ValidateIf((o) => !o.password)
  @IsString()
  @IsNotEmpty()
  verificationId?: string;
}

export class UpdatePasswordDto extends DynamicAuthRequestDto {
  @IsNotEmpty()
  @IsString()
  passwordIntended!: string;
}

export class RemoveContactDto extends DynamicAuthRequestDto {
  target!: string;
}
