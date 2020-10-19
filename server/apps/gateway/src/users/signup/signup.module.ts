import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { UsersModule } from "../users.module";
import { SignUpController } from "./signup.controller";

@Module({
  imports: [UsersModule, SessionModule],
  controllers: [SignUpController],
  providers: [],
})
export class SignUpModule {}
