import { RepositoryModule } from "@app/repositories";
import { Module } from "@nestjs/common";
import { ContactVerificationModule } from "@app/contact-verification";
import { SessionModule } from "@app/session";
import { UsersService } from "./users.service";

@Module({
  imports: [RepositoryModule, ContactVerificationModule, SessionModule],
  providers: [UsersService],
})
export class UsersModule {}
