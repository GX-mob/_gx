import { IContactDto } from "./common-dto.interfaces";

export interface IAuthBasicResponse<Next> {
  next: Next;
}

export interface IAuthResponseStruct<Next, Body>
  extends IAuthBasicResponse<Next> {
  body: Body;
}

export type IAuthIdentifyResponse =
  | IAuthBasicResponse<"password">
  | IAuthBasicResponse<"code">;

export type IAuthPasswordResponse =
  | IAuthResponseStruct<"authorized", { token: string }>
  | IAuthResponseStruct<"code", { target: string }>;

export type IAuthCodeResponse = IAuthResponseStruct<
  "authorized",
  { token: string }
>;
export type IAuthSuccessfulResponse = { next: "authorized"; token: string };

export interface IAuthPasswordDto extends IContactDto {
  password: string;
}

export interface IAuthCodeDto extends IContactDto {
  code: string;
}
