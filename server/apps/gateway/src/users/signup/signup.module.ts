import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { UsersModule } from "../users.module";
import { SessionModule } from "@app/session";
import { SignUpController } from "./signup.controller";

@Module({
  imports: [UsersModule],
  controllers: [SignUpController],
  providers: [],
})
export class SignUpModule {}
