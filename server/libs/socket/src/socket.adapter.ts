import { IoAdapter } from "@nestjs/platform-socket.io";
import { SocketModule, SocketService } from ".";
import { INestApplication } from "@nestjs/common";
import { ConfigOptions } from "./types";

export class SocketAdapter extends IoAdapter {
  private socketService: SocketService;

  constructor(
    app: INestApplication,
    private serviceConfiguration: ConfigOptions,
  ) {
    super(app);

    this.socketService = app
      .select(SocketModule)
      .get(SocketService, { strict: true });
  }
  createIOServer(port: number, options: any = {}): any {
    const server = super.createIOServer(port, {
      ...options,
      parser: this.serviceConfiguration.parser.parser,
    });

    this.socketService.configureServer(server, this.serviceConfiguration);

    return server;
  }
}
