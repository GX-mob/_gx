import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RepositoryModule } from "@app/repositories";
import { LoggerModule } from "nestjs-pino";
import { UserHttpModule } from "./user/user-http.module";
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
    UserHttpModule,
    RidesModule,
  ],
})
export class AppModule {}
