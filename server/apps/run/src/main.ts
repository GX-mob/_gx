import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketServerNode } from "./node";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new SocketServerNode(app));

  await app.listen(3001);
}
bootstrap();
