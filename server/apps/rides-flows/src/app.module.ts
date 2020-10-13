import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewaysModule } from "./gateways/gateways.module";
import { LoggerModule } from "nestjs-pino";
import { MATCH, OFFER } from "./configuration/state.config";
import { RepositoryModule } from "@app/repositories";
import { CacheModule } from "@app/cache";
import { SessionModule } from "@app/session";
import { SocketModule } from "@app/socket";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
      load: [MATCH, OFFER],
    }),
    LoggerModule.forRoot({
      pinoHttp: { prettyPrint: process.env.NODE_ENV !== "production" },
    }),
    CacheModule,
    RepositoryModule,
    SocketModule,
    SessionModule,
    GatewaysModule,
  ],
  providers: [],
})
export class AppModule {}
