import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { UserAuthController } from "./auth.controller";
import { UserModule } from "../user.module";

@Module({
  imports: [SessionModule, UserModule],
  controllers: [UserAuthController],
  providers: [],
})
export class UserAuthModule {}
