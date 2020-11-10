import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Socket } from "socket.io";
import { PendencieRepository } from "@app/repositories";
import { CacheService } from "@app/cache";
import { AuthService } from "@app/auth";
import { SocketService } from "@app/socket";
import { RideStatus, RidePayMethods, UserRoles } from "@shared/interfaces";
import {
  EVENTS,
  EventsInterface,
  Position,
  OfferRequest,
  CancelRide,
  CanceledRide,
  CANCELATION_RESPONSE,
  DriverState,
} from "@shared/events";
import { UncancelableRideException } from "../exceptions";
import { NAMESPACES } from "../constants";
import { ConnectionService, DriversService, RidesService } from "../state";
import { Common } from "./common";

@WebSocketGateway({ namespace: NAMESPACES.VOYAGERS })
export class VoyagersGateway extends Common {
  role = UserRoles.VOYAGER;
  constructor(
    readonly socketService: SocketService<EventsInterface>,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: AuthService,
    readonly cacheService: CacheService,
    readonly connectionService: ConnectionService,
    readonly driversService: DriversService,
    readonly ridesService: RidesService,
    readonly logger: PinoLogger,
  ) {
    super(
      socketService,
      pendencieRepository,
      sessionService,
      connectionService,
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
    await this.ridesService.createOffer(offer, client);
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
    const ride = await this.ridesService.getRide({ pid: ridePID });

    const { _id, rides } = socket.data;

    this.ridesService.checkIfInRide(ride, _id);

    // block cancel running ride
    if (ride.status === RideStatus.RUNNING) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    const offer = await this.ridesService.getOfferData(ridePID);
    const { driverSocketId, acceptTimestamp } = offer;

    // remove the ride from user rides list
    const rideIdx = rides.indexOf(ride.pid);

    if (rideIdx > -1) {
      rides.splice(rideIdx, 1);
    }

    const isSafeCancel = this.ridesService.isSafeCancel(
      acceptTimestamp as number,
      now,
    );
    const isCreditPayment = ride.payMethod === RidePayMethods.CreditCard;
    const status = isSafeCancel
      ? CANCELATION_RESPONSE.SAFE
      : isCreditPayment
      ? CANCELATION_RESPONSE.CHARGE_REQUESTED
      : CANCELATION_RESPONSE.PENDENCIE_ISSUED;

    this.driversService.updateDriver(socket.id, {
      state: DriverState.SEARCHING,
    });
    this.socketService.emit(driverSocketId as string, EVENTS.CANCELED_RIDE, {
      ridePID,
      status,
    });
    this.ridesService.updateRide(
      { pid: ridePID },
      { status: RideStatus.CANCELED },
    );

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
