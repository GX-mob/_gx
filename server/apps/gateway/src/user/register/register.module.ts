import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { UserModule } from "../user.module";
import { UserRegisterController } from "./register.controller";

@Module({
  imports: [UserModule, SessionModule],
  controllers: [UserRegisterController],
  providers: [],
})
export class UserRegisterModule {}
