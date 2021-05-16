import { Module } from "@nestjs/common";
import { AuthModule } from "@app/auth";
import { StorageModule } from "@app/storage";
import { UserModule } from "../account.module";

import { AccountProfileController } from "./profile.controller";
import { AccountContactController } from "./contact.controller";
import { AccountSecurityController } from "./security.controller";

@Module({
  imports: [UserModule, AuthModule, StorageModule],
  controllers: [
    AccountProfileController,
    AccountContactController,
    AccountSecurityController,
  ],
})
export class UserManagementModule {}
