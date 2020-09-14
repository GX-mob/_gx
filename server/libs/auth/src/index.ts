import { FastifyRequest } from "fastify";
import { Session } from "@app/repositories";

export * from "./http-auth.guard";
export * from "./ws-auth.guard";
export * from "./auth.decorator";

export interface AuthorizedRequest extends FastifyRequest {
  session: Session;
}
