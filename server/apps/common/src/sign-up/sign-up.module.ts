import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { SignUpController } from "./sign-up.controller";

@Module({
  imports: [ContactVerificationModule, SessionModule],
  controllers: [SignUpController],
  providers: [],
})
export class SignUpModule {}
