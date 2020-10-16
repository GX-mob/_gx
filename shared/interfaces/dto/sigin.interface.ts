import { IUser } from "../models/user.interface";
import { IContactDto } from "./common-dto.interfaces";

export enum SignInHttpReponseCodes {
  Success = 201,
  SecondaFactorRequired = 202,
}

export interface SignInSuccessResponse {
  /**
   * Session token
   */
  token: string;
}

export interface IdentifyResponseInterface {
  firstName: IUser["firstName"];
  avatar: IUser["avatar"];
}

export interface Password2FARequiredResponse {
  /**
   * Hidden 2fa code receiver
   */
  target: string;
}

export interface SignInPasswordDtoInterface extends IContactDto {
  password: string;
}

export interface SignInCodeDtoInterface extends IContactDto {
  code: string;
}
