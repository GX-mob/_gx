import { Module } from "@nestjs/common";
import { DatabaseModule } from "@app/database";
import { CacheModule } from "@app/cache";
import { DataService } from "./data.service";

@Module({
  imports: [CacheModule, DatabaseModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
