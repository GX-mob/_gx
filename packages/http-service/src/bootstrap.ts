/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import "source-map-support/register";
import "reflect-metadata";
import fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import fastifySwagger from "fastify-swagger";
import fastifyMultipart from "fastify-multipart";
import fastifyRateLimit from "fastify-rate-limit";
import fastifyCircuitBreak from "fastify-circuit-breaker";
import fastifyRedis from "fastify-redis";
import { bootstrap } from "fastify-decorators";
import { logger, DataBaseConnection } from "./helpers";
import { Redis } from "ioredis";

type Service = {
  controllers: any[];
  redis: string | Redis;
  options?: FastifyServerOptions;
};

export default function instanceBootstrap(service: Service): FastifyInstance {
  const { controllers, redis, options } = service;

  const instance: FastifyInstance = fastify(
    options ? { ...options, logger } : { logger }
  );

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
  instance.register(fastifySwagger, {
    exposeRoute: process.env.NODE_ENV === "development",
  });

  // Controllers autoload
  instance.register(bootstrap, {
    controllers,
  });

  instance.decorateRequest("session", "");

  /**
   * Shared common schemas
   */
  instance.addSchema({
    $id: "userPublicData",
    type: "object",
    properties: {
      pid: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      avatar: { type: "string" },
      averageEvaluation: { type: "integer" },
    },
  });

  return instance;
}
