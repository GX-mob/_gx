import {
  IContactVerificationCheckDto,
  IUserRegisterDto,
  IUserRegisterSuccessDto,
} from "@shared/interfaces";
import { ENDPOINTS } from "../constants";
import { HTTP_EXCEPTIONS_MESSAGES } from "@shared/http-exceptions";
import { IHttpExceptionBase } from "./exceptions";
import ky from "ky";

const agent = ky.extend({
  prefixUrl: ENDPOINTS.REGISTER,
});

export interface IHttpException
  extends IHttpExceptionBase<
    | HTTP_EXCEPTIONS_MESSAGES.INVALID_CONTACT
    | HTTP_EXCEPTIONS_MESSAGES.TERMS_NOT_ACCEPTED
    | HTTP_EXCEPTIONS_MESSAGES.CONTACT_ALREADY_REGISTRED
    | HTTP_EXCEPTIONS_MESSAGES.CONTACT_VERIFICATION_FAILED
    | HTTP_EXCEPTIONS_MESSAGES.INVALID_CPF
    | HTTP_EXCEPTIONS_MESSAGES.CPF_REGISTRED
  > {}

//const agent = createAgent(ENDPOINTS.REGISTER);

export function verify(contact: string) {
  return agent.post("verify", { json: { contact } });
}

export function check(body: IContactVerificationCheckDto) {
  return agent.post("check", { json: body });
}

export function finish(body: IUserRegisterDto) {
  return agent.post("", { json: body }).json<IUserRegisterSuccessDto>();
}

export default {
  verify,
  check,
  finish,
};
