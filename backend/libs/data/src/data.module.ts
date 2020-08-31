import { Module } from "@nestjs/common";
import { DataService } from "./data.service";
import { DatabaseModule } from "@app/database";
import { CacheModule } from "@app/cache";

@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
