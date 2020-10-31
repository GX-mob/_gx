import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import fastifyHelmet from "fastify-helmet";
import fastifyCompress from "fastify-compress";
import fastifyRateLimit from "fastify-rate-limit";
import { parsers } from "extensor";
import { SocketAdapter } from "@app/socket";
import { serverEventsSchemas } from "@shared/events";
import { logger } from "@app/helpers";
import { CacheService } from "@app/cache";
import { AppModule } from "./app.module";
import { BROADCASTED_EVENTS } from "./constants";

const FastifyAdapterInstance = new FastifyAdapter({
  logger,
  trustProxy: true,
});

const fastifyInstance = FastifyAdapterInstance.getInstance();

fastifyInstance.register(fastifyHelmet);
fastifyInstance.register(fastifyCompress, { encodings: ["gzip", "deflate"] });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);
  const cacheService = app.get(CacheService);
  const parser = parsers.schemapack(serverEventsSchemas as any);

  app.enableCors();

  fastifyInstance.register(fastifyRateLimit, {
    redis: cacheService.redis,
  });

  app.useWebSocketAdapter(
    new SocketAdapter(app, {
      parser,
      redis: {
        pubClient: cacheService.redis.duplicate(),
        subClient: cacheService.redis.duplicate(),
      },
      broadcastedEvents: BROADCASTED_EVENTS,
    }),
  );

  return app;
}

bootstrap().then((app) => {
  if (module === require.main) {
    app.listen(process.env.PORT || 3001, process.env.HOST || "0.0.0.0");
  }
});

module.exports = FastifyAdapterInstance.getHttpServer();
