import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import {
  RideStatus,
  RidePayMethods,
  Ride,
  USERS_ROLES,
  PendencieRepository,
  RideRepository,
} from "@app/repositories";
import { Socket } from "socket.io";
import {
  EVENTS,
  EventsInterface,
  Position,
  OfferRequest,
  CancelRide,
  CanceledRide,
  CANCELATION_RESPONSE,
  DriverState,
} from "../events";
import { CacheService } from "@app/cache";
import { SessionService } from "@app/session";
import { SocketService } from "@app/socket";
import { StateService } from "../state.service";
import { PinoLogger } from "nestjs-pino";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  role = USERS_ROLES.VOYAGER;
  constructor(
    readonly socketService: SocketService<EventsInterface>,
    readonly rideRepository: RideRepository,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: SessionService,
    readonly stateService: StateService,
    readonly cacheService: CacheService,
    readonly logger: PinoLogger,
  ) {
    super(
      socketService,
      rideRepository,
      pendencieRepository,
      sessionService,
      stateService,
      cacheService,
      logger,
    );

    logger.setContext(VoyagersGateway.name);
  }

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() socket: Socket,
  ) {
    super.positionEventHandler(position, socket);
  }

  @SubscribeMessage(EVENTS.OFFER)
  async offerEventHandler(
    @MessageBody() offer: OfferRequest,
    @ConnectedSocket() client: Socket,
  ) {
    await this.stateService.createOffer(offer, client);
    return true;
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
