import { Module } from "@nestjs/common";
import { SessionService } from "@app/session";
import { SocketModule } from "@app/socket";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";
import { StateService } from "../state.service";

@Module({
  imports: [SocketModule],
  providers: [StateService, SessionService, VoyagersGateway, DriversGateway],
})
export class GatewaysModule {}
