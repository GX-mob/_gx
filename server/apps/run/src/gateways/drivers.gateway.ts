import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { USERS_ROLES } from "@app/database";
import { Socket } from "socket.io";
import { Position } from "../schemas/events/position";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  public role = USERS_ROLES.DRIVER;

  @SubscribeMessage("position")
  positionEvent(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversState.setPosition(client.id, position);

    this.positionEventHandler(position, client);
  }
}
