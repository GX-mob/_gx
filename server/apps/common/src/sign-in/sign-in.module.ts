import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { SignInController } from "./sign-in.controller";

@Module({
  imports: [ContactVerificationModule, SessionModule],
  controllers: [SignInController],
  providers: [],
})
export class SignInModule {}
