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
import { EVENTS, Position, State } from "../events";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  public role = USERS_ROLES.VOYAGER;

  @SubscribeMessage(EVENTS.STATE)
  stateEvent(@MessageBody() state: State, @ConnectedSocket() client: Socket) {
    console.log(state, client.id);
  }

  @SubscribeMessage(EVENTS.POSITION)
  positionEvent(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    this.positionEventHandler(position, client);
  }
}
