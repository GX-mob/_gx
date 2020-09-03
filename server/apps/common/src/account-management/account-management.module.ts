// TODO account management tests
import { Module } from "@nestjs/common";
import { DataModule } from "@app/data";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";

import { ProfileController } from "./profile.controller";
import { ContactController } from "./contact.controller";
import { SecurityController } from "./security.controller";

@Module({
  imports: [SessionModule, DataModule, StorageModule],
  controllers: [ProfileController, ContactController, SecurityController],
})
export class AccountManagementModule {}
