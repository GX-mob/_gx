import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { RepositoryModule } from "@app/repositories";
import { CacheModule } from "@app/cache";
import { AuthModule } from "@app/auth";
import { SocketModule } from "@app/socket";
import { GatewaysModule } from "./gateways/gateways.module";

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
    AuthModule,
    GatewaysModule,
  ],
})
export class AppModule {}
