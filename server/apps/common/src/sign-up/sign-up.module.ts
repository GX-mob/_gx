import { Module } from "@nestjs/common";
import { CacheModule } from "@app/cache";
import { DataModule } from "@app/data";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { SignUpController } from "./sign-up.controller";

@Module({
  imports: [CacheModule, DataModule, ContactVerificationModule, SessionModule],
  controllers: [SignUpController],
  providers: [],
})
export class SignUpModule {}
