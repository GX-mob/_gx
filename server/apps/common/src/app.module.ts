import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@app/cache";
import { ContactVerificationModule } from "@app/contact-verification";
import { DatabaseModule } from "@app/database";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";
import { SignInController } from "./sign-in/sign-in.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
    DatabaseModule,
    CacheModule,
    ContactVerificationModule,
    DataModule,
    SessionModule,
    StorageModule,
  ],
  controllers: [SignInController],
  providers: [],
})
export class AppModule {}
