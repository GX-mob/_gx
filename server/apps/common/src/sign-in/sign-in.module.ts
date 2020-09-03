import { Module } from "@nestjs/common";
import { DataModule } from "@app/data";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { SignInController } from "./sign-in.controller";

@Module({
  imports: [DataModule, ContactVerificationModule, SessionModule],
  controllers: [SignInController],
  providers: [],
})
export class SignInModule {}
