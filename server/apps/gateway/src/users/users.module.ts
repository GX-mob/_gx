import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { UsersService } from "./users.service";

@Module({
  imports: [ContactVerificationModule, SessionModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
