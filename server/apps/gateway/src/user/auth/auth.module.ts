import { Module } from "@nestjs/common";
import { UserAuthController } from "./auth.controller";
import { UserModule } from "../user.module";

@Module({
  imports: [UserModule],
  controllers: [UserAuthController],
  providers: [],
})
export class UserAuthModule {}
