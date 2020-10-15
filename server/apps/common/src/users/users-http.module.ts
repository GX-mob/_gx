import { Module } from "@nestjs/common";
import { SignInModule } from "./sign-in/signin.module";

@Module({
  imports: [SignInModule],
})
export class UsersHttpModule {}
