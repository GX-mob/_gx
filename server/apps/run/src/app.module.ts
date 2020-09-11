import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewaysModule } from "./gateways/gateways.module";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
    LoggerModule.forRoot({
      pinoHttp: { prettyPrint: process.env.NODE_ENV !== "production" },
    }),
    GatewaysModule,
  ],
  providers: [],
})
export class AppModule {}
