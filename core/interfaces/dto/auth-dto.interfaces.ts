import { IContactDto } from "./common-dto.interfaces";

export enum EAuthorizationNextSteps {
  Password = "password",
  Code = "code",
  Authorized = "authorized",
}

export interface IAuthBasicResponse<Next extends EAuthorizationNextSteps> {
  next: Next;
}

export interface IAuthResponseStruct<Next extends EAuthorizationNextSteps, Body>
  extends IAuthBasicResponse<Next> {
  body: Body;
}

export type IAuthIdentifyResponse =
  | IAuthBasicResponse<EAuthorizationNextSteps.Password>
  | IAuthBasicResponse<EAuthorizationNextSteps.Code>;

export type IAuthPasswordResponse =
  | IAuthResponseStruct<EAuthorizationNextSteps.Authorized, { token: string }>
  | IAuthResponseStruct<EAuthorizationNextSteps.Code, { target: string }>;

export type IAuthCodeResponse = IAuthResponseStruct<
  EAuthorizationNextSteps.Authorized,
  { token: string }
>;
export type IAuthSuccessfulResponse = {
  next: EAuthorizationNextSteps.Authorized;
  token: string;
};

export interface IAuthPasswordDto extends IContactDto {
  password: string;
}

export interface IAuthCodeDto extends IContactDto {
  code: string;
}

export interface IDynamicAuthRequestDto {
  password?: string;
  contact?: string;
  verificationCode?: string;
  verificationId?: string;
}
