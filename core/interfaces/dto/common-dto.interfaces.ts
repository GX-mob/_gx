export interface IContactDto {
  email?: string;
  mobilePhone?: string;
}

export interface IContactVerificationCheckDto extends IContactDto {
  code: string;
}
