import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContactVerificationService } from "./contact-verification.service";
import { TwilioService } from "./twilio.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TwilioService, ContactVerificationService],
  exports: [TwilioService, ContactVerificationService],
})
export class ContactVerificationModule {}
