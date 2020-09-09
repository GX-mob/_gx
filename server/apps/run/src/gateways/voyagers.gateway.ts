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
import { EVENTS, Position, State, OfferRequest } from "../events";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  public role = USERS_ROLES.VOYAGER;

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() socket: Socket,
  ) {
    this.positionEventHandler(position, socket);
  }

  @SubscribeMessage(EVENTS.OFFER)
  offerEventHandler(
    @MessageBody() offer: OfferRequest,
    @ConnectedSocket() socket: Socket,
  ) {
    this.offersState.createOffer(offer, socket.id);
  }

  @SubscribeMessage(EVENTS.AM_I_RUNNING)
  amIRunningHandler(@ConnectedSocket() socket: Socket) {
    return socket.connection.rides;
  }
}
