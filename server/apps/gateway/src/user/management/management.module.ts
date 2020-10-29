import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";
import { UserModule } from "../user.module";

import { UserProfileController } from "./profile.controller";
import { UserContactController } from "./contact.controller";
import { UserSecurityController } from "./security.controller";

@Module({
  imports: [UserModule, SessionModule, StorageModule],
  controllers: [
    UserProfileController,
    UserContactController,
    UserSecurityController,
  ],
})
export class UserManagementModule {}
