import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES, CANCELATION, CANCELATION_EXCEPTIONS } from "../constants";
import { Common } from "./common";
import {
  USERS_ROLES,
  Pendencie,
  RideStatus,
  RidePayMethods,
  Ride,
} from "@app/database";
import { Socket } from "socket.io";
import {
  EVENTS,
  Position,
  OfferRequest,
  CancelRide,
  CanceledRide,
} from "../events";

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
    this.stateService.createOffer(offer, socket.connection);
  }

  @SubscribeMessage(EVENTS.AM_I_RUNNING)
  amIRunningHandler(@ConnectedSocket() socket: Socket) {
    return socket.connection.rides;
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

    if (ride.voyager !== _id) {
      return { status: "error", error: CANCELATION_EXCEPTIONS.NOT_IN_RIDE };
    }

    const offer = await this.stateService.getOfferData(ridePID);
    const { driverSocketId, acceptTimestamp } = offer;

    // remove the ride from user connection data object
    const rides = socket.connection.rides as string[];
    const rideIdx = rides.indexOf(ride.pid);

    if (rideIdx > -1) {
      rides.splice(rideIdx, 1);
    }

    /**
     * Safe cancel, no pendencie needed
     */
    if ((acceptTimestamp as number) + CANCELATION.SAFE_TIME_MS > now) {
      await this.dataService.rides.update(
        { pid: ridePID },
        { status: RideStatus.CANCELED },
      );

      // Informe to driver the cancelation event
      this.socketService.emit<CanceledRide>(
        driverSocketId as string,
        EVENTS.CANCELED_RIDE,
        { ridePID, pendencie: "" },
      );

      return { status: "ok" };
    }

    /**
     * Creates a pendencie if the payment method is money
     */
    if (ride.payMethod === RidePayMethods.Money) {
      const pendencie = await this.createPendencie({
        ride,
        issuer: ride.voyager,
        affected: ride.driver,
      });

      // Informe to driver the cancelation event
      this.socketService.emit<CanceledRide>(
        driverSocketId as string,
        EVENTS.CANCELED_RIDE,
        { ridePID, pendencie: pendencie._id },
      );

      return { status: "ok", pendencie: pendencie._id };
    }

    // TODO stripe api, request payment

    return { status: "ok" };
  }
}
