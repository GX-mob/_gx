import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import fastifyHelmet from "fastify-helmet";
import fastifyMultipart from "fastify-multipart";
import { logger } from "@app/helpers";
import { AppModule } from "./app.module";

const FastifyAdapterInstance = new FastifyAdapter({
  logger,
  trustProxy: true,
});

const fastifyInstance = FastifyAdapterInstance.getInstance();

fastifyInstance.register(fastifyHelmet);
fastifyInstance.register(fastifyMultipart);
fastifyInstance.decorateRequest("session", {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  await app.listen(
    Number(process.env.PORT) || 3000,
    (process.env.HOST && String(process.env.HOST)) || "localhost",
  );
}
bootstrap();

module.exports = FastifyAdapterInstance.getHttpServer();
