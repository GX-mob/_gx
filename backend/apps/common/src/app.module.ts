import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppService } from "./app.service";
import { CacheModule } from "@app/cache";
import { ContactVerificationModule } from "@app/contact-verification";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";
import { AuthController } from "./auth/auth.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".development.env",
    }),
    CacheModule,
    ContactVerificationModule,
    DataModule,
    SessionModule,
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [AppService],
})
export class AppModule {}
