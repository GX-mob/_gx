import {
  IContactDto,
  IContactVerificationCheckDto,
} from "./common-dto.interfaces";
import { IUser, TUserCreate } from "../../domain/user";

export interface IUserRegisterDto
  extends IContactDto,
    IContactVerificationCheckDto, Omit<TUserCreate, "primaryMobilePhone" | "primaryEmail"> {
}

export interface IUserRegisterSuccessDto {
  user: {
    id: string;
  };
  session: {
    token: string;
  };
}
