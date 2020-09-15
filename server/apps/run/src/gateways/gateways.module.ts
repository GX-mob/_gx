import { Module } from "@nestjs/common";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";
import { StateService } from "../state.service";
import { SessionService } from "@app/session";
import { SocketModule, SocketService } from "@app/socket";

@Module({
  imports: [SocketModule],
  providers: [
    StateService,
    SessionService,
    SocketService,
    VoyagersGateway,
    DriversGateway,
  ],
})
export class GatewaysModule {}
