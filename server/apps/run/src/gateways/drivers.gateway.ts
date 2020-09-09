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
import {
  EVENTS,
  Position,
  Setup,
  Configuration,
  OfferResponse,
} from "../events";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  public role = USERS_ROLES.DRIVER;

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    super.positionEventHandler(position, client);
    this.driversState.positionEvent(client.id, position);
  }

  @SubscribeMessage(EVENTS.DRIVER_SETUP)
  setupEventHandler(
    @MessageBody() setup: Setup,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversState.setupDriverEvent(client.id, setup, client.connection);

    return client.connection.state;
  }

  @SubscribeMessage(EVENTS.CONFIGURATION)
  configurationEventHandler(
    @MessageBody() config: Configuration,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversState.setConfigurationEvent(client.id, config);
  }

  @SubscribeMessage(EVENTS.OFFER_RESPONSE)
  offerResponseEventHandler(
    @MessageBody() offerResponse: OfferResponse,
    @ConnectedSocket() client: Socket,
  ) {
    const offer = this.offersState.findOffer(offerResponse.ridePID);

    if (!offer) return;

    this.driversState.offerResponseEvent(client.id, offerResponse);
  }
}
