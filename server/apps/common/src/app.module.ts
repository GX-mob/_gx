import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SignInModule } from "./sign-in/sign-in.module";
import { SignUpModule } from "./sign-up/sign-up.module";
import { AccountManagementModule } from "./account-management/account-management.module";
import { RidesModule } from "./rides/rides.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
    SignInModule,
    SignUpModule,
    AccountManagementModule,
    RidesModule,
  ],
  providers: [ConfigService],
})
export class AppModule {}
