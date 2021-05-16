import { Module } from "@nestjs/common";
import { UserModule } from "../account.module";
import { AccountSignUpController } from "./signup.controller";

@Module({
  imports: [UserModule],
  controllers: [AccountSignUpController],
  providers: [],
})
export class AccountSignUpModule {}
