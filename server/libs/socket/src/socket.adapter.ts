import { IoAdapter } from "@nestjs/platform-socket.io";
import { SocketModule, SocketService } from ".";
import { INestApplication } from "@nestjs/common";
import { ConfigOptions } from "./types";
import { Server } from "socket.io";

export class SocketAdapter extends IoAdapter {
  private socketService: SocketService;

  constructor(
    app: INestApplication,
    private serviceConfiguration: ConfigOptions,
  ) {
    super(app);

    this.socketService = app.select(SocketModule).get(SocketService);
  }
  createIOServer(port: number, options: any = {}): any {
    const server: Server = super.createIOServer(port, {
      ...options,
      parser: this.serviceConfiguration.parser.parser,
      perMessageDeflate: false,
    });

    this.socketService.configureServer(server, this.serviceConfiguration);

    return server;
  }
}
