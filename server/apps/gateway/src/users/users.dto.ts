import { IsNotEmpty, IsString, IsNumberString } from "class-validator";
import { ContactDtoInterface } from "@shared/interfaces";

export class ContactDto implements ContactDtoInterface {
  @IsNotEmpty()
  @IsString()
  contact!: string;
}

export class ContactVerificationCheckDto {
  @IsNotEmpty()
  @IsString()
  contact!: string;

  @IsNotEmpty()
  @IsNumberString()
  code!: string;
}
