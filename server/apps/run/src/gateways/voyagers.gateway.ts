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
  CANCELATION_RESPONSE,
  DriverState,
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
    super.positionEventHandler(position, socket);
  }

  @SubscribeMessage(EVENTS.OFFER)
  offerEventHandler(
    @MessageBody() offer: OfferRequest,
    @ConnectedSocket() socket: Socket,
  ) {
    this.stateService.createOffer(offer, socket.data);
  }

  @SubscribeMessage(EVENTS.AM_I_RUNNING)
  amIRunningHandler(@ConnectedSocket() socket: Socket) {
    return socket.data.rides;
  }

  @SubscribeMessage(EVENTS.CANCEL_RIDE)
  async cancelRideEventHandler(
    @MessageBody() ridePID: CancelRide,
    @ConnectedSocket() socket: Socket,
  ): Promise<{ status: CanceledRide["status"] | "error"; error?: string }> {
    const now = Date.now();
    const ride = (await this.rideRepository.get({ pid: ridePID })) as Ride;

    const { _id, rides } = socket.data;

    this.cancelationSecutiryChecks(ride, _id, "voyager");

    const offer = await this.stateService.getOfferData(ridePID);
    const { driverSocketId, acceptTimestamp } = offer;

    // remove the ride from user rides list
    const rideIdx = rides.indexOf(ride.pid);

    if (rideIdx > -1) {
      rides.splice(rideIdx, 1);
    }

    const isSafeCancel = this.isSafeCancel(acceptTimestamp as number, now);
    const isCreditPayment = ride.payMethod === RidePayMethods.CreditCard;

    const status = isSafeCancel
      ? CANCELATION_RESPONSE.SAFE
      : isCreditPayment
      ? CANCELATION_RESPONSE.CHARGE_REQUESTED
      : CANCELATION_RESPONSE.PENDENCIE_ISSUED;

    this.stateService.updateDriver(socket.id, { state: DriverState.SEARCHING });
    this.updateRide({ pid: ridePID }, { status: RideStatus.CANCELED });

    this.socketService.emit(driverSocketId as string, EVENTS.CANCELED_RIDE, {
      ridePID,
      status,
    });

    switch (status) {
      case CANCELATION_RESPONSE.CHARGE_REQUESTED:
        // TODO: this.paymentService.requestCharge();
        break;
      case CANCELATION_RESPONSE.PENDENCIE_ISSUED:
        this.createPendencie({
          ride: ride._id,
          issuer: ride.voyager,
          affected: ride.driver,
        });
        break;
    }

    return { status };
  }
}
