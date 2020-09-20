import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketAdapter } from "@app/socket";
import { parsers } from "extensor";
import { serverEventsSchemas } from "@shared/events";
import { logger } from "@app/helpers";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { BROADCASTED_EVENTS } from "./constants";

console.log("@#@!#1");

const FastifyAdapterInstance = new FastifyAdapter({
  logger,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, FastifyAdapterInstance);

  const parser = parsers.schemapack(serverEventsSchemas as any);

  const redis =
    process.env.NODE_ENV !== "production" && !process.env.REDIS_URI
      ? {
          pubClient: new (require("ioredis-mock"))(),
          subClient: new (require("ioredis-mock"))(),
        }
      : (process.env.REDIS_URI as string);

  app.useWebSocketAdapter(
    new SocketAdapter(app, {
      parser,
      redis,
      broadcastedEvents: BROADCASTED_EVENTS,
    }),
  );

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

  await app.listen(PORT);
}
bootstrap();

module.exports = FastifyAdapterInstance.getHttpServer();
