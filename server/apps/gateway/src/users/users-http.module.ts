import { Module } from "@nestjs/common";
import { SignInModule } from "./signin/signin.module";
import { SignUpModule } from "./signup/signup.module";
import { ManagementModule } from "./management/management.module";

@Module({
  imports: [SignInModule, SignUpModule, ManagementModule],
})
export class UsersHttpModule {}
