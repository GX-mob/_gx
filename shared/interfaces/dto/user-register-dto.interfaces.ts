import {
  IContactDto,
  IContactVerificationCheckDto,
} from "./common-dto.interfaces";

export interface IUserRegisterDto
  extends IContactDto,
    IContactVerificationCheckDto {
  firstName: string;
  lastName: string;
  cpf: string;
  birth: string;
  terms: boolean;
  password?: string;
}

export interface IUserRegisterSuccessDto {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
