import { Module, DynamicModule } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { ConfigModule } from "@nestjs/config";
import { ConfigOptions } from "./types";
import { OPTIONS_KEY } from "./constants";

@Module({})
export class SocketModule {
  static forRoot(options: ConfigOptions): DynamicModule {
    return {
      module: SocketModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: OPTIONS_KEY,
          useValue: options,
        },
        SocketService,
      ],
      exports: [SocketService],
    };
  }
}
