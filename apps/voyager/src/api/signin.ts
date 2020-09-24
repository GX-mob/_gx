import {
  IdentifyResponseInterface,
  SignInHttpReponseCodes,
  SignInSuccessResponse,
  SignInCodeDtoInterface,
  SignInPasswordDtoInterface,
} from "@shared/interfaces";
import ky from "ky";
import { HttpException } from "./exceptions";
import { ENDPOINTS } from "../constants";

export enum NextStep {
  Code = "Code",
  Password = "Password",
  Main = "Main",
}

type ApiReponse<Content> = {
  [K in keyof Content]: Content[K];
} & {
  /**
   * Next step of workflow
   */ next: NextStep;
};

const IdentifyNextRef: any = {
  200: NextStep.Password,
  [SignInHttpReponseCodes.SecondaFactorRequired]: NextStep.Code,
};

const PasswordNextRef: any = {
  [SignInHttpReponseCodes.Success]: NextStep.Main,
  [SignInHttpReponseCodes.SecondaFactorRequired]: NextStep.Code,
};

export const signin = ky.extend({
  prefixUrl: ENDPOINTS.SIGNIN,
});

export async function identify(
  id: string,
): Promise<ApiReponse<IdentifyResponseInterface>> {
  const response = await signin.get(id);
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  const next = IdentifyNextRef[response.status];

  return { ...content, next };
}

export async function password(
  body: SignInPasswordDtoInterface,
): Promise<ApiReponse<SignInSuccessResponse>> {
  const response = await signin.post("/", { json: body });
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  const next = PasswordNextRef[response.status];

  return { ...content, next };
}

export async function code(
  body: SignInCodeDtoInterface,
): Promise<ApiReponse<SignInSuccessResponse>> {
  const response = await signin.post("/code", { json: body });
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  return { ...content, next: NextStep.Main };
}
