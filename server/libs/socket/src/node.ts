import { IoAdapter } from "@nestjs/platform-socket.io";
import { SocketModule, SocketService } from "./";

export class SocketServerNode extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const socketService: SocketService = this.httpServer
      .select(SocketModule)
      .get(SocketService, { strict: true });

    const server = super.createIOServer(port, options);

    socketService.configureServer(server);

    return server;
  }
}
