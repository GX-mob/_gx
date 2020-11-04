import {
  IAuthIdentifyResponse,
  IAuthPasswordResponse,
  IAuthCodeResponse,
  IAuthPasswordDto,
  IAuthCodeDto,
} from "@shared/interfaces";
import { ENDPOINTS } from "../constants";
import { createAgent } from "./http";

const agent = createAgent(ENDPOINTS.LOGIN);

export async function identify(id: string) {
  const { content } = await agent.get<IAuthIdentifyResponse>(`id/${id}`);
  return content;
}

export async function password(body: IAuthPasswordDto) {
  const { content } = await agent.post<IAuthPasswordResponse>(
    "credential",
    body,
  );
  return content;
}

export async function code(body: IAuthCodeDto) {
  const { content } = await agent.post<IAuthCodeResponse>("code", body);

  return content;
}

export default {
  identify,
  password,
  code,
};
