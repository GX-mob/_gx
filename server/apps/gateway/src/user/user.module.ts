import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { UserService } from "./user.service";

@Module({
  imports: [ContactVerificationModule, SessionModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
