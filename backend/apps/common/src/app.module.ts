import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@app/cache";
import { ContactVerificationModule } from "@app/contact-verification";
import { DatabaseModule } from "@app/repository";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";

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
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}
