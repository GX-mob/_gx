import { IsEmail, IsNotEmpty, ValidateIf, IsString } from "class-validator";

export class SignInPasswordDto {
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class SignInCodeDto {
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;
}
