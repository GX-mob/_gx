import { Module } from "@nestjs/common";
import { DataModule } from "@app/data";
import { CacheModule } from "@app/cache";
import { SessionService } from "./session.service";

@Module({
  imports: [CacheModule, DataModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
