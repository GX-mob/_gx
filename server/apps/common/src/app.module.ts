import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@app/cache";
import { RepositoryModule } from "@app/repositories";
import { SignInModule } from "./sign-in/sign-in.module";
import { SignUpModule } from "./sign-up/sign-up.module";
import { AccountManagementModule } from "./account-management/account-management.module";
import { RidesModule } from "./rides/rides.module";
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
    CacheModule,
    RepositoryModule,
    SignInModule,
    SignUpModule,
    AccountManagementModule,
    RidesModule,
  ],
  providers: [ConfigService],
})
export class AppModule {}
