import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketNode } from "./socket.node";
import { parsers } from "extensor";
import { schemas } from "./schemas";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const parser = parsers.schemapack(schemas);

  const redis =
    process.env.NODE_ENV !== "production" && !process.env.REDIS_URI
      ? {
          pubClient: new (require("ioredis-mock"))(),
          subClient: new (require("ioredis-mock"))(),
        }
      : (process.env.REDIS_URI as string);

  const socketNode = new SocketNode(app, {
    parser,
    redis,
    broadcastedEvents: ["setup", "position", "offerResponse", "configuration"],
  });

  app.useWebSocketAdapter(socketNode);

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

  await app.listen(PORT);
}
bootstrap();
