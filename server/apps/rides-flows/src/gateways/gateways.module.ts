import { Module } from "@nestjs/common";
import { AuthService } from "@app/auth";
import { SocketModule } from "@app/socket";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";
import { StateModule } from "../state";

@Module({
  imports: [SocketModule, StateModule],
  providers: [AuthService, VoyagersGateway, DriversGateway],
})
export class GatewaysModule {}
