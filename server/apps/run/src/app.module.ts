import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewaysModule } from "./gateways/gateways.module";
import { LoggerModule } from "nestjs-pino";
import { MATCH, OFFER } from "./configuration/state.config";
import { RepositoryModule } from "@app/repositories";
import { CacheModule } from "@app/cache";

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
    GatewaysModule,
  ],
  providers: [],
})
export class AppModule {}
