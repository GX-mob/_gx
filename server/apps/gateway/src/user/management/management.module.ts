import { Module } from "@nestjs/common";
import { AuthModule } from "@app/auth";
import { StorageModule } from "@app/storage";
import { UserModule } from "../user.module";

import { UserProfileController } from "./profile.controller";
import { UserContactController } from "./contact.controller";
import { UserSecurityController } from "./security.controller";

@Module({
  imports: [UserModule, AuthModule, StorageModule],
  controllers: [
    UserProfileController,
    UserContactController,
    UserSecurityController,
  ],
})
export class UserManagementModule {}
