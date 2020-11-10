import { Module } from "@nestjs/common";
import { ConnectionService } from "./connection.service";
import { RidesService } from "./rides.service";
import { DriversService } from "./drivers.service";

@Module({
  imports: [],
  providers: [ConnectionService, RidesService, DriversService],
  exports: [ConnectionService, RidesService, DriversService],
})
export class StateModule {}
