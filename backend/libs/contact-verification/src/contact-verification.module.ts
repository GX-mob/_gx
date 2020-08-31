import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContactVerificationService } from "./contact-verification.service";
import { TwilioService } from "./twilio.service";

@Module({
  imports: [ConfigModule],
  providers: [ContactVerificationService, TwilioService],
  exports: [ContactVerificationService, TwilioService],
})
export class ContactVerificationModule {}
