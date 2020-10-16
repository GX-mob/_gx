import { Module } from "@nestjs/common";
import { UsersModule } from "../users.module";
import { SignUpController } from "./signup.controller";

@Module({
  imports: [UsersModule],
  controllers: [SignUpController],
  providers: [],
})
export class SignUpModule {}
