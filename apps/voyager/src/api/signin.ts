import {
  IdentifyResponseInterface,
  SignInHttpReponseCodes,
  SignInSuccessResponse,
  SignInCodeDtoInterface,
  SignInPasswordDtoInterface,
  Password2FARequiredResponse,
} from "@shared/interfaces";
import ky from "ky";
import { HttpException } from "./exceptions";
import { ENDPOINTS } from "../constants";

export enum SignInSteps {
  Code = "Code",
  Password = "Password",
  Main = "Main",
}

type ApiReponse<Content, Next> = {
  content: { [K in keyof Content]: Content[K] };
  /**
   * Next step of workflow
   */
  next: Next;
};

export const signin = ky.extend({
  prefixUrl: ENDPOINTS.SIGNIN,
});

export async function identify(
  id: string,
): Promise<
  ApiReponse<IdentifyResponseInterface, SignInSteps.Password | SignInSteps.Code>
> {
  const response = await signin.get(`id/${id}`);
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  const next =
    response.status === 200 ? SignInSteps.Password : SignInSteps.Code;

  return { content, next };
}

export async function password(
  body: SignInPasswordDtoInterface,
): Promise<
  ApiReponse<
    SignInSuccessResponse & Password2FARequiredResponse,
    SignInSteps.Code | SignInSteps.Main
  >
> {
  const response = await signin.post("sign", { json: body });
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  const next =
    response.status === SignInHttpReponseCodes.Success
      ? SignInSteps.Main
      : SignInSteps.Code;

  return { content, next };
}

export async function code(
  body: SignInCodeDtoInterface,
): Promise<ApiReponse<SignInSuccessResponse, SignInSteps.Main>> {
  const response = await signin.post("code", { json: body });
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  return { content, next: SignInSteps.Main };
}
