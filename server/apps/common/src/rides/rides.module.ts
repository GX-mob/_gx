import { Module } from "@nestjs/common";
import { DataModule } from "@app/data";
import { RidesService } from "./rides.service";
import { RidesController } from "./rides.controller";

@Module({
  imports: [DataModule],
  providers: [RidesService],
  controllers: [RidesController],
})
export class RidesModule {}
