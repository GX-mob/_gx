import { Module } from "@nestjs/common";
import { SessionModule } from "@app/session";
import { RidesService } from "./rides.service";
import { RidesController } from "./rides.controller";

@Module({
  imports: [SessionModule],
  providers: [RidesService],
  controllers: [RidesController],
})
export class RidesModule {}
