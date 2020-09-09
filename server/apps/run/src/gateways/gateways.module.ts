import { Module } from "@nestjs/common";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";

@Module({
  imports: [VoyagersGateway, DriversGateway],
  providers: [],
})
export class GatewaysModule {}
