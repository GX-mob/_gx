import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import { Pendencie, Ride } from "@app/repositories";
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
import { CANCELATION } from "../constants";
import { Driver } from "@app/auth";

@Driver()
@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
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
    await this.stateService.setupDriverEvent(client.id, setup, client.data);

    return client.data.state;
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
    this.stateService.offerResponseEvent(client.id, offerResponse, client.data);
  }

  @SubscribeMessage(EVENTS.CANCEL_RIDE)
  async cancelRideEventHandler(
    @MessageBody() ridePID: CancelRide,
    @ConnectedSocket() socket: Socket,
  ): Promise<{
    status: CanceledRide["status"] | "error";
    error?: string;
    pendencie?: Pendencie["_id"];
  }> {
    const now = Date.now();
    const ride = (await this.rideRepository.get({ pid: ridePID })) as Ride;
    const { _id } = socket.data;

    this.cancelationSecutiryChecks(ride, _id, "driver");

    const offer = await this.stateService.getOfferData(ridePID);
    const { requesterSocketId, acceptTimestamp } = offer;

    this.stateService.updateDriver(socket.id, { state: DriverState.SEARCHING });

    /**
     * Safe cancel, no pendencie needed
     */
    if ((acceptTimestamp as number) + CANCELATION.SAFE_TIME_MS > now) {
      this.updateRide({ pid: ridePID }, { driver: null });

      this.socketService.emit(requesterSocketId, EVENTS.CANCELED_RIDE, {
        ridePID,
        status: "safe",
      });

      return { status: "safe" };
    }

    this.createPendencie({
      ride: ride._id,
      issuer: ride.driver,
      affected: ride.voyager,
    });

    this.socketService.emit(requesterSocketId, EVENTS.CANCELED_RIDE, {
      ridePID,
      status: "pendencie-issued",
    });

    return { status: "pendencie-issued" };
  }
}
