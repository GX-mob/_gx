import { Session } from "./models/session";

declare module "fastify" {
  interface FastifyRequest {
    session?: Session;
  }
}
