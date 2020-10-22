import { IsNotEmpty, IsString } from "class-validator";
import { IContactDto, IContactVerificationCheckDto } from "@shared/interfaces";

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
