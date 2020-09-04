import { Module } from "@nestjs/common";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";

import { AccountProfileController } from "./profile.controller";
import { AccountContactController } from "./contact.controller";
import { SecurityController } from "./security.controller";

@Module({
  imports: [SessionModule, DataModule, StorageModule],
  controllers: [
    AccountProfileController,
    AccountContactController,
    SecurityController,
  ],
})
export class AccountManagementModule {}
