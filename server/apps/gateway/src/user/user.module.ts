import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { AuthModule } from "@app/auth";
import { UserService } from "./user.service";

@Module({
  imports: [ContactVerificationModule, AuthModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
