import { Module } from "@nestjs/common";
import { DataService } from "./data.service";
import { DatabaseService } from "@app/database";
import { CacheService } from "@app/cache";

@Module({
  imports: [DatabaseService, CacheService],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
