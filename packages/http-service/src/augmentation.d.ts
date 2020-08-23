import { Session } from "./database/models/session";

declare module "fastify" {
  interface FastifyRequest {
    session?: Session;
  }
}
