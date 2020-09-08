import { Module } from "@nestjs/common";
import { SocketModule, SocketService } from "@app/socket";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";

@Module({
  imports: [SocketModule, VoyagersGateway, DriversGateway],
  providers: [SocketService],
})
export class EventsModule {}
