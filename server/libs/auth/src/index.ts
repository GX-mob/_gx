import { FastifyRequest } from "fastify";
import { ISession } from "@shared/interfaces";

export * from "./auth.guard";
export * from "./auth.decorator";
export * from "./session.decorator";
export * from "./user.decorator";

export interface AuthorizedRequest extends FastifyRequest {
  session: ISession;
}
