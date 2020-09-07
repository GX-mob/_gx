import { IoAdapter } from "@nestjs/platform-socket.io";
import { ConfigModule, ConfigService } from "@nestjs/config";
import redisIoAdapter from "socket.io-redis";

export class SocketServerNode extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const config: ConfigService = this.httpServer
      .select(ConfigModule)
      .get(ConfigService, { strict: true });

    const redisUri = config.get<string>("REDIS_URI") as string;

    const server = super.createIOServer(port, options);
    const redisAdapter = redisIoAdapter(redisUri);

    server.adapter(redisAdapter);
    return server;
  }
}
