import {
  IContactDto,
  IContactVerificationCheckDto,
} from "./common-dto.interfaces";
import { TAccountCreate } from "../../domain/account";

export interface IUserRegisterDto
  extends IContactDto,
    IContactVerificationCheckDto, Omit<TAccountCreate, "primaryMobilePhone" | "primaryEmail"> {
}

export interface IUserRegisterSuccessDto {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
