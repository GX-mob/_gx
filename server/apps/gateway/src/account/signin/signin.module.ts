import { Module } from "@nestjs/common";
import { AccountSignInController } from "./signin.controller";
import { UserModule } from "../account.module";

@Module({
  imports: [UserModule],
  controllers: [AccountSignInController],
  providers: [],
})
export class AccountSignInModule {}
