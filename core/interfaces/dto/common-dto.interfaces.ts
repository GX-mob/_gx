export interface IContactDto {
  contact: string;
}

export interface IContactVerificationCheckDto extends IContactDto {
  verificationCode: string;
}

export interface IContactVerificationResponseDto {
  verificationRequestId: string;
}
