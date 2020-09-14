import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";

import { AccountProfileController } from "./profile.controller";
import { AccountContactController } from "./contact.controller";
import { AccountSecurityController } from "./security.controller";

@Module({
  imports: [SessionModule, StorageModule],
  controllers: [
    AccountProfileController,
    AccountContactController,
    AccountSecurityController,
  ],
})
export class AccountManagementModule {}
