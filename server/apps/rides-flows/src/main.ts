import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketAdapter } from "@app/socket";
import { parsers } from "extensor";
import { serverEventsSchemas } from "@shared/events";
import { logger } from "@app/helpers";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import fastifyHelmet from "fastify-helmet";
import fastifyCompress from "fastify-compress";
import fastifyRateLimit from "fastify-rate-limit";
import { BROADCASTED_EVENTS } from "./constants";
import { CacheService } from "@app/cache";

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
  const redis = process.env.REDIS_URI as string;

  app.enableCors();

  fastifyInstance.register(fastifyRateLimit, {
    redis: cacheService.redis,
  });

  app.useWebSocketAdapter(
    new SocketAdapter(app, {
      parser,
      redis,
      broadcastedEvents: BROADCASTED_EVENTS,
    }),
  );

  return app;
}

bootstrap().then((app) => {
  if (module === require.main) {
    app.listen(process.env.PORT || 3001, process.env.HOST || "");
  }
});

module.exports = FastifyAdapterInstance.getHttpServer();
