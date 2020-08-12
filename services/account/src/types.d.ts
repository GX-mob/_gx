import { Session } from "@gx-mob/http-service/dist/models";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
  }
}
