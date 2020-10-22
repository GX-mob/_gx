import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RepositoryModule } from "@app/repositories";
import { UserHttpModule } from "./user/user-http.module";
import { RidesModule } from "./rides/rides.module";
import { LoggerModule } from "nestjs-pino";
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
  providers: [ConfigService],
})
export class AppModule {}
