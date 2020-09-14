import { Module } from "@nestjs/common";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";
import { StateService } from "../state.service";
import { SessionService, SessionModule } from "@app/session";
import { SocketModule, SocketService } from "@app/socket";

@Module({
  imports: [SessionModule, SocketModule, VoyagersGateway, DriversGateway],
  providers: [StateService, SessionService, SocketService],
})
export class GatewaysModule {}
