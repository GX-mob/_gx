import {
  IdentifyResponseInterface,
  SignInHttpReponseCodes,
  SignInSuccessResponse,
  SignInCodeDtoInterface,
  SignInPasswordDtoInterface,
  Password2FARequiredResponse,
} from "@shared/interfaces";
import { ENDPOINTS } from "../constants";
import { createAgent } from "./http";
import { SignInScreens } from "@/screens/signin/common";

type ApiReponse<Content, Next> = {
  content: { [K in keyof Content]: Content[K] };
  /**
   * Next step of workflow
   */
  next: Next;
};

const agent = createAgent(ENDPOINTS.SIGNIN);

export async function identify(
  id: string,
): Promise<
  ApiReponse<
    IdentifyResponseInterface,
    SignInScreens.Password | SignInScreens.Code
  >
> {
  const { response, content } = await agent.get(`id/${id}`);
  const next =
    response.status === 200 ? SignInScreens.Password : SignInScreens.Code;

  return { content, next };
}

export async function password(
  body: SignInPasswordDtoInterface,
): Promise<
  ApiReponse<
    SignInSuccessResponse & Password2FARequiredResponse,
    SignInScreens.Code | "Main"
  >
> {
  const { response, content } = await agent.post("credential", body);
  const next =
    response.status === SignInHttpReponseCodes.Success
      ? "Main"
      : SignInScreens.Code;

  return { content, next };
}

export async function code(
  body: SignInCodeDtoInterface,
): Promise<ApiReponse<SignInSuccessResponse, "Main">> {
  const { content } = await agent.post("code", body);

  return { content, next: "Main" };
}

export default {
  identify,
  password,
  code,
};
