import { Module } from "@nestjs/common";
import { UserModule } from "../user.module";
import { UserRegisterController } from "./register.controller";

@Module({
  imports: [UserModule],
  controllers: [UserRegisterController],
  providers: [],
})
export class UserRegisterModule {}
