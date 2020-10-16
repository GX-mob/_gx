import { Module } from "@nestjs/common";
import { RepositoryService } from "@app/repositories";
import { SessionModule } from "@app/session";
import { StorageModule } from "@app/storage";
import { UsersModule } from "../users.module";

import { ProfileController } from "./profile.controller";
import { ContactController } from "./contact.controller";
import { SecurityController } from "./security.controller";

@Module({
  imports: [RepositoryService, UsersModule, SessionModule, StorageModule],
  controllers: [ProfileController, ContactController, SecurityController],
})
export class ManagementModule {}
