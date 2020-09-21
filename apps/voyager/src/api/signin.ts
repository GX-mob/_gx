import {
  IdentifyResponseInterface,
  SignInHttpReponseCodes,
  SignInSuccessResponse,
  SignInCodeDtoInterface,
  SignInPasswordDtoInterface,
} from "@shared/interfaces";
import { signin } from "./http";

export enum NextStep {
  Code,
  Password,
  Main,
}

const IdentifyNextRef: any = {
  200: NextStep.Password,
  [SignInHttpReponseCodes.SecondaFactorRequired]: NextStep.Code,
};

const PasswordNextRef: any = {
  [SignInHttpReponseCodes.Success]: NextStep.Main,
  [SignInHttpReponseCodes.SecondaFactorRequired]: NextStep.Code,
};

type ApiReponse<Content> = {
  [K in keyof Content]: Content[K];
} & {
  /**
   * Next step of workflow
   */ next: NextStep;
};

export async function identify(
  id: string,
): Promise<ApiReponse<IdentifyResponseInterface>> {
  const response = await signin.get(id);
  const content: IdentifyResponseInterface = await response.json();

  if (!response.ok) {
    throw content;
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
    throw content;
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
    throw content;
  }

  return { ...content, next: NextStep.Main };
}
