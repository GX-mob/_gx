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
import { EVENTS, Position } from "../events";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  public role = USERS_ROLES.DRIVER;

  @SubscribeMessage(EVENTS.POSITION)
  positionEvent(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversState.positionEvent(client.id, position);

    this.positionEventHandler(position, client);
  }
}
