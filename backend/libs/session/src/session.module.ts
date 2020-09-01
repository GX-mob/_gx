import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DataModule } from "@app/data";
import { CacheModule } from "@app/cache";
import { SessionService } from "./session.service";

@Module({
  imports: [ConfigModule, CacheModule, DataModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
