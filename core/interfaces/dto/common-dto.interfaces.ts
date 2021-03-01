export interface IContactDto {
  contact: string;
}

export interface IContactVerificationCheckDto extends IContactDto {
  code: string;
}
