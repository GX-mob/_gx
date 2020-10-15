import { Module } from "@nestjs/common";
import { SignInController } from "./sign-in.controller";
import { UsersModule } from "../users.module";

@Module({
  imports: [UsersModule],
  controllers: [SignInController],
  providers: [],
})
export class SignInModule {}
