import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import fastifyMultipart from "fastify-multipart";
import { logger } from "@app/helpers";
import { AppModule } from "./app.module";

const FastifyAdapterInstance = new FastifyAdapter({
  logger,
});

const fastifyInstance = FastifyAdapterInstance.getInstance();

fastifyInstance.register(fastifyMultipart);
fastifyInstance.decorateRequest("session", {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(3000);
}
bootstrap();

module.exports = FastifyAdapterInstance.getHttpServer();
