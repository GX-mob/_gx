import { FastifyRequest } from "fastify";
import { SessionInterface } from "@shared/interfaces";

export * from "./auth.guard";
export * from "./auth.decorator";

export interface AuthorizedRequest extends FastifyRequest {
  session: SessionInterface;
}
