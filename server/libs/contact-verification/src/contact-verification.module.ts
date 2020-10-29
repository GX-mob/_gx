import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@app/cache";
import { ContactVerificationService } from "./contact-verification.service";
import { TwilioService } from "./twilio.service";

@Global()
@Module({
  imports: [CacheModule],
  providers: [TwilioService, ContactVerificationService],
  exports: [TwilioService, ContactVerificationService],
})
export class ContactVerificationModule {}
