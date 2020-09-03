import { FastifyRequest } from "fastify";
import { Session } from "@app/database";

export * from "./auth.guard";
export * from "./auth.decorator";

export interface AuthorizedRequest extends FastifyRequest {
  session: Session;
}
