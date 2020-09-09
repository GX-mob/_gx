import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { USERS_ROLES } from "@app/database";
import { Socket } from "socket.io";
import { Position } from "../schemas/events/position";
import { State } from "../schemas/events/state";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  public role = USERS_ROLES.VOYAGER;

  @SubscribeMessage("state")
  stateEvent(@MessageBody() state: State, @ConnectedSocket() client: Socket) {
    console.log(state, client.id);
  }

  @SubscribeMessage("position")
  positionEvent(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    this.positionEventHandler(position, client);
  }
}
