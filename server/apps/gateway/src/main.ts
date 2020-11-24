import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import fastifyHelmet from "fastify-helmet";
import fastifyCompress from "fastify-compress";
import fastifyMultipart from "fastify-multipart";
import fastifyRateLimit from "fastify-rate-limit";
import { logger } from "@app/helpers";
import { AppModule } from "./app.module";
import { CacheService } from "@app/cache";

const FastifyAdapterInstance = new FastifyAdapter({
  logger,
  trustProxy: true,
  ignoreTrailingSlash: true,
});

const fastifyInstance = FastifyAdapterInstance.getInstance();

fastifyInstance.register(fastifyHelmet);
fastifyInstance.register(fastifyMultipart);
fastifyInstance.register(fastifyCompress, { encodings: ["gzip", "deflate"] });
fastifyInstance.decorateRequest("session", {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);
  const cacheService = app.get(CacheService);

  fastifyInstance.register(fastifyRateLimit, {
    redis: cacheService.redis,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  return app;
}

bootstrap().then((app) => {
  if (module === require.main) {
    app.listen(process.env.PORT || 3000, process.env.HOST || "0.0.0.0");
  }
});

module.exports = FastifyAdapterInstance.getHttpServer();
