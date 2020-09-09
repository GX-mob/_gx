import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketAdapter } from "@app/socket";
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

  app.useWebSocketAdapter(
    new SocketAdapter(app, {
      parser,
      redis,
      broadcastedEvents: [
        "setup",
        "position",
        "offerResponse",
        "configuration",
      ],
    }),
  );

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

  await app.listen(PORT);
  console.log("listening on:", await app.getUrl());
}
bootstrap();
