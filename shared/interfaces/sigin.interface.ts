import { UserInterface } from "./user.interface";

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
  firstName: UserInterface["firstName"];
  avatar: UserInterface["avatar"];
}

export interface Password2FARequiredResponse {
  /**
   * Hidden 2fa code receiver
   */
  target: string;
}

export interface SignInPasswordDtoInterface {
  phone: string;
  password: string;
}

export interface SignInCodeDtoInterface {
  phone: string;
  code: string;
}
