import { Module, Global } from "@nestjs/common";
import { SessionService } from "./session.service";

@Global()
@Module({
  imports: [],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
