import { IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class UpdateProfileDto {
  @ValidateIf((o) => !o.lastName)
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ValidateIf((o) => !o.firstName)
  @IsNotEmpty()
  @IsString()
  lastName!: string;
}
