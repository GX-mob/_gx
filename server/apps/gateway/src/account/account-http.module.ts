import { Module } from "@nestjs/common";
import { AccountSignInModule } from "./signin/signin.module";
import { AccountSignUpModule } from "./signup/signup.module";
import { UserManagementModule } from "./management/management.module";

@Module({
  imports: [AccountSignInModule, AccountSignUpModule, UserManagementModule],
})
export class AccountHttpModule {}
