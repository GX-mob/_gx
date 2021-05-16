import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RepositoryModule } from "@app/repositories";
import { LoggerModule } from "nestjs-pino";
import { AccountHttpModule } from "./account/account-http.module";
import { RidesModule } from "./rides/rides.module";

@Module({
  imports: [
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
    AccountHttpModule,
    RidesModule,
  ],
})
export class AppModule {}
