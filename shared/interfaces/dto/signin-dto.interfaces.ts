import { IUser } from "../models/user.interface";
import { IContactDto } from "./common-dto.interfaces";

type SignInResponseStruct<Next, Body> = {
  next: Next;
  body: Body;
};

type SignInIdentifyResponseBase = { avatar?: string; firstName: string };
export type SignInIdentify =
  | SignInResponseStruct<"password", SignInIdentifyResponseBase>
  | SignInResponseStruct<"code", SignInIdentifyResponseBase>;

export type SignInPasswordResponse =
  | SignInResponseStruct<"authorized", { token: string }>
  | SignInResponseStruct<"code", { target: string }>;

export type SignInCodeResponse = SignInResponseStruct<
  "authorized",
  { token: string }
>;
// export type SignInIdentifyResponse = { next: "password" } & SignInIdentifyResponseBase | { next:  }
export type SignInAuthenticatedResponse = { next: "authorized"; token: string };
export type SignInResponse = { next: "code" } | SignInAuthenticatedResponse;

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
