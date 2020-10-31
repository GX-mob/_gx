import { Module } from "@nestjs/common";
import { AuthService } from "@app/auth";
import { SocketModule } from "@app/socket";
import { VoyagersGateway } from "./voyagers.gateway";
import { DriversGateway } from "./drivers.gateway";
import { StateService } from "../state.service";

@Module({
  imports: [SocketModule],
  providers: [StateService, AuthService, VoyagersGateway, DriversGateway],
})
export class GatewaysModule {}
