import { Module } from "@nestjs/common";
import { UserAuthModule } from "./auth/auth.module";
import { UserRegisterModule } from "./register/register.module";
import { UserManagementModule } from "./management/management.module";

@Module({
  imports: [UserAuthModule, UserRegisterModule, UserManagementModule],
})
export class UserHttpModule {}
