import "reflect-metadata";
import { join } from "path";
import fastify, {
  FastifyInstance,
  FastifyServerOptions,
  FastifyRequest,
} from "fastify";
import fastifyMultipart from "fastify-multipart";
import fastifyRateLimit from "fastify-rate-limit";
import fastifyCircuitBreak from "fastify-circuit-breaker";
import fastifyRedis from "fastify-redis";
import { bootstrap } from "fastify-decorators";
import { logger, DataBaseConnection } from "./helpers";
import { getClientIp } from "request-ip";
import { Redis } from "ioredis";

// fastify augmentation
import { User } from "./models/user";

declare module "fastify" {
  export interface FastifyRequest {
    getRealIp(): string;
    user?: User;
  }
}

type ServiceSettings = {
  directory: string;
  redis: string | Redis;
};

export default function instanceBootstrap(
  ServiceSettings: ServiceSettings,
  opts: FastifyServerOptions = {}
): FastifyInstance {
  const instance: FastifyInstance = fastify({ ...opts, logger });
  const { directory, redis } = ServiceSettings;

  // Database connection
  instance.register(DataBaseConnection);

  // Third-party plugins
  instance.register(fastifyMultipart);
  instance.register(fastifyCircuitBreak);
  instance.register(
    fastifyRedis,
    typeof redis === "string" ? { url: redis } : { client: redis }
  );
  instance.register(fastifyRateLimit, {
    max: 100,
    timeWindow: 1000 * 60,
    redis: instance.redis,
  });

  // Controllers autoload
  instance.register(bootstrap, {
    directory: join(directory, "controllers"),
    mask: /(\.)?(controller)\.(js|ts)$/,
  });

  // Augmentation
  instance.decorateRequest("getRealIp", "");
  instance.addHook("onRequest", (request, _reply, next) => {
    let ip: string;
    request.getRealIp = () => ip || (ip = getClientIp(request.raw));
    next();
  });

  return instance;
}
