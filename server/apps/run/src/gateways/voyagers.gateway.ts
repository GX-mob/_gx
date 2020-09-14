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
} from "@app/repositories";
import { Socket } from "socket.io";
import {
  EVENTS,
  Position,
  OfferRequest,
  CancelRide,
  CanceledRide,
} from "../events";
import { Voyager } from "@app/auth";

@Voyager()
@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  //public role = USERS_ROLES.VOYAGER;

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
  ): Promise<{ status: CanceledRide["status"] | "error"; error?: string }> {
    const now = Date.now();
    const ride = (await this.rideRepository.get({ pid: ridePID })) as Ride;

    const { _id } = socket.connection;

    this.cancelationSecutiryChecks(ride, _id, "voyager");

    const offer = await this.stateService.getOfferData(ridePID);
    const { driverSocketId, acceptTimestamp } = offer;

    // remove the ride from user rides list
    const rides = socket.connection.rides as string[];
    const rideIdx = rides.indexOf(ride.pid);

    if (rideIdx > -1) {
      rides.splice(rideIdx, 1);
    }

    /**
     * Safe cancel, no pendencie needed
     */
    if ((acceptTimestamp as number) + CANCELATION.SAFE_TIME_MS > now) {
      this.updateRide({ pid: ridePID }, { status: RideStatus.CANCELED });

      // Informe to driver the cancelation event
      this.socketService.emit(driverSocketId as string, EVENTS.CANCELED_RIDE, {
        ridePID,
        status: "safe",
      });

      return { status: "safe" };
    }

    /**
     * Creates a pendencie if the payment method is money
     */
    if (ride.payMethod === RidePayMethods.Money) {
      this.createPendencie({
        ride,
        issuer: ride.voyager,
        affected: ride.driver,
      });

      // Informe to driver the cancelation event
      this.socketService.emit(driverSocketId as string, EVENTS.CANCELED_RIDE, {
        ridePID,
        status: "pendencie-issued",
      });

      return { status: "pendencie-issued" };
    }

    // TODO stripe api, request payment charge

    return { status: "safe" };
  }
}
