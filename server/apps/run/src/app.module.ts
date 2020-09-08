import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SessionModule, SessionService } from "@app/session";
import { DataModule } from "@app/data";
import { CacheModule, CacheService } from "@app/cache";
import { SocketModule, SocketService } from "@app/socket";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
    SocketModule,
    DataModule,
    SessionModule,
    CacheModule,
    EventsModule,
  ],
  providers: [SocketService, SessionService, CacheService],
})
export class AppModule {}
