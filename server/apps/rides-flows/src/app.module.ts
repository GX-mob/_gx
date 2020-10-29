import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewaysModule } from "./gateways/gateways.module";
import { LoggerModule } from "nestjs-pino";
import { RepositoryModule } from "@app/repositories";
import { CacheModule } from "@app/cache";
import { SessionModule } from "@app/session";
import { SocketModule } from "@app/socket";

@Module({
  imports: [
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        ".env",
      ],
    }),
    LoggerModule.forRoot({
      pinoHttp: { prettyPrint: process.env.NODE_ENV !== "production" },
    }),
    RepositoryModule,
    SocketModule,
    SessionModule,
    GatewaysModule,
  ],
})
export class AppModule {}
