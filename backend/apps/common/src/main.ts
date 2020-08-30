import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { FastifyAdapter } from "@nestjs/platform-fastify";

const FastifyAdapterInstance = new FastifyAdapter({
  logger: { level: "info" },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);
  await app.listen(3000);
}
bootstrap();

module.exports = FastifyAdapterInstance.getHttpServer();
