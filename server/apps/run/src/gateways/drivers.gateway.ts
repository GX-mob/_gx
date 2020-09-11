import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { USERS_ROLES, Pendencie, RideStatus } from "@app/database";
import { Socket } from "socket.io";
import {
  EVENTS,
  DriverState,
  Position,
  Setup,
  Configuration,
  OfferResponse,
  CancelRide,
  CanceledRide,
} from "../events";
import { CANCELATION, CANCELATION_EXCEPTIONS } from "../constants";
import { client } from "extensor/dist/auth";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  public role = USERS_ROLES.DRIVER;

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    super.positionEventHandler(position, client);
    this.stateService.positionEvent(client.id, position);
  }

  @SubscribeMessage(EVENTS.DRIVER_SETUP)
  async setupEventHandler(
    @MessageBody() setup: Setup,
    @ConnectedSocket() client: Socket,
  ) {
    await this.stateService.setupDriverEvent(
      client.id,
      setup,
      client.connection,
    );

    return client.connection.state;
  }

  @SubscribeMessage(EVENTS.CONFIGURATION)
  configurationEventHandler(
    @MessageBody() config: Configuration,
    @ConnectedSocket() client: Socket,
  ) {
    this.stateService.setConfigurationEvent(client.id, config);
  }

  @SubscribeMessage(EVENTS.OFFER_RESPONSE)
  offerResponseEventHandler(
    @MessageBody() offerResponse: OfferResponse,
    @ConnectedSocket() client: Socket,
  ) {
    this.stateService.offerResponseEvent(
      client.id,
      offerResponse,
      client.connection,
    );
  }

  @SubscribeMessage(EVENTS.CANCEL_RIDE)
  async cancelRideEventHandler(
    @MessageBody() ridePID: CancelRide,
    @ConnectedSocket() socket: Socket,
  ): Promise<{ status: string; error?: string; pendencie?: Pendencie["_id"] }> {
    const now = Date.now();
    const ride = await this.dataService.rides.get({ pid: ridePID });

    /**
     * Security checks
     */
    if (!ride) {
      return { status: "error", error: CANCELATION_EXCEPTIONS.RIDE_NOT_FOUND };
    }

    // block cancel running ride
    if (ride.status === RideStatus.RUNNING) {
      return { status: "error", error: CANCELATION_EXCEPTIONS.RIDE_RUNNING };
    }

    const { _id } = socket.connection;

    if (ride.driver !== _id) {
      return { status: "error", error: CANCELATION_EXCEPTIONS.NOT_IN_RIDE };
    }

    const offer = await this.stateService.getOfferData(ridePID);
    const { requesterSocketId, acceptTimestamp } = offer;

    this.stateService.updateDriver(socket.id, { state: DriverState.SEARCHING });

    /**
     * Safe cancel, no pendencie needed
     */
    if ((acceptTimestamp as number) + CANCELATION.SAFE_TIME_MS > now) {
      await this.dataService.rides.update({ pid: ridePID }, { driver: null });

      this.socketService.emit<CanceledRide>(
        requesterSocketId,
        EVENTS.CANCELED_RIDE,
        { ridePID, pendencie: "" },
      );

      return { status: "ok" };
    }

    const pendencie = await this.createPendencie({
      ride: ride._id,
      issuer: ride.driver,
      affected: ride.voyager,
    });

    this.socketService.emit<CanceledRide>(
      requesterSocketId,
      EVENTS.CANCELED_RIDE,
      { ridePID, pendencie: pendencie._id },
    );

    return { status: "ok", pendencie: pendencie._id };
  }
}
