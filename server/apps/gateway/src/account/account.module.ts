import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { AuthModule } from "@app/auth";
import { AccountService } from "./account.service";

@Module({
  imports: [ContactVerificationModule, AuthModule],
  providers: [AccountService],
  exports: [AccountService],
})
export class UserModule {}
