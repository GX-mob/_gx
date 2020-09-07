import { Module } from "@nestjs/common";
import { CacheModule } from "@app/cache";
import { DataModule } from "@app/data";
import { DatabaseModule } from "@app/database";
import { SessionModule } from "@app/session";
import { RidesService } from "./rides.service";
import { RidesController } from "./rides.controller";

@Module({
  imports: [CacheModule, DatabaseModule, DataModule, SessionModule],
  providers: [RidesService],
  controllers: [RidesController],
})
export class RidesModule {}
