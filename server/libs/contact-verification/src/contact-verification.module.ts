import { Module, Global } from "@nestjs/common";
import { ContactVerificationService } from "./contact-verification.service";
import { TwilioService } from "./twilio.service";

@Global()
@Module({
  imports: [],
  providers: [TwilioService, ContactVerificationService],
  exports: [TwilioService, ContactVerificationService],
})
export class ContactVerificationModule {}
