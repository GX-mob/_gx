import {
  IContactVerificationCheckDto,
  IUserRegisterDto,
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
  IAuthCodeResponse,
  IAuthPasswordDto,
  IAuthCodeDto,
} from "@shared/interfaces";
import { ENDPOINTS } from "../constants";
import { createAgent } from "./http";

const agent = createAgent(ENDPOINTS.REGISTER);

export function verify(contact: string) {
  return agent.get(`verify/${contact}`);
}

export function check(body: IContactVerificationCheckDto) {
  return agent.post("check", body);
}

export function finish(body: IUserRegisterDto) {
  return agent.post("", body);
}

export default {
  verify,
  check,
  finish,
};
