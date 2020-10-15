import { Module } from "@nestjs/common";
import { SignInModule } from "./signin/signin.module";

@Module({
  imports: [SignInModule],
})
export class UsersHttpModule {}
