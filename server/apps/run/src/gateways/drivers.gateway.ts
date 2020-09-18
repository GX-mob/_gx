import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { NAMESPACES } from "../constants";
import { Common } from "./common";
import {
  Pendencie,
  PendencieRepository,
  Ride,
  RideRepository,
  RideStatus,
  USERS_ROLES,
} from "@app/repositories";
import { Socket } from "socket.io";
import {
  EVENTS,
  EventsInterface,
  DriverState,
  Position,
  Setup,
  Configuration,
  OfferResponse,
  CancelRide,
  CanceledRide,
  CANCELATION_RESPONSE,
  PickingUpPath,
} from "../events";
import { CacheService } from "@app/cache";
import { SessionService } from "@app/session";
import { SocketService } from "@app/socket";
import { StateService } from "../state.service";
import { PinoLogger } from "nestjs-pino";
import { ConfigService } from "@nestjs/config";
import {
  RideNotFoundException,
  UncancelableRideException,
} from "../exceptions";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common {
  role = USERS_ROLES.DRIVER;

  constructor(
    readonly configService: ConfigService,
    readonly socketService: SocketService<EventsInterface>,
    readonly rideRepository: RideRepository,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: SessionService,
    readonly stateService: StateService,
    readonly cacheService: CacheService,
    readonly logger: PinoLogger,
  ) {
    super(
      configService,
      socketService,
      rideRepository,
      pendencieRepository,
      sessionService,
      stateService,
      cacheService,
      logger,
    );

    logger.setContext(DriversGateway.name);
  }

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    super.positionEventHandler(position, client);
    this.stateService.positionEvent(client.id, position);
    //this.trackingService.track(client.data, position);
  }

  @SubscribeMessage(EVENTS.DRIVER_SETUP)
  async setupEventHandler(
    @MessageBody() setup: Setup,
    @ConnectedSocket() client: Socket,
  ) {
    await this.stateService.setupDriverEvent(client.id, setup, client.data);
    return true;
  }

  @SubscribeMessage(EVENTS.CONFIGURATION)
  configurationEventHandler(
    @MessageBody() config: Configuration,
    @ConnectedSocket() client: Socket,
  ) {
    this.stateService.setConfigurationEvent(client.id, config);
  }

  @SubscribeMessage(EVENTS.OFFER_RESPONSE)
  async offerResponseEventHandler(
    @MessageBody() offerResponse: OfferResponse,
    @ConnectedSocket() client: Socket,
  ) {
    this.stateService.offerResponseEvent(client.id, offerResponse, client.data);
  }

  @SubscribeMessage(EVENTS.PICKING_UP_PATH)
  async pickingUpPathEventHandler(
    @MessageBody() pickingUp: PickingUpPath,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await super.getRide({ pid: pickingUp.ridePID });

    super.checkIfInRide(ride, client.data._id, "driver");

    const { requesterSocketId } = await this.stateService.setOfferData(
      pickingUp.ridePID,
      {
        pickingUpPath: pickingUp,
      },
    );

    this.socketService.emit(
      requesterSocketId,
      EVENTS.PICKING_UP_PATH,
      pickingUp,
    );
  }

  @SubscribeMessage(EVENTS.CANCEL_RIDE)
  async cancelRideEventHandler(
    @MessageBody() ridePID: CancelRide,
    @ConnectedSocket() client: Socket,
  ): Promise<{
    status: CanceledRide["status"] | "error";
    error?: string;
    pendencie?: Pendencie["_id"];
  }> {
    const now = Date.now();
    const ride = await super.getRide({ pid: ridePID });
    const { _id } = client.data;

    super.checkIfInRide(ride, _id, "driver");

    // block cancel running ride
    if (ride.status === RideStatus.RUNNING) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    const offer = await this.stateService.getOfferData(ridePID);
    const { requesterSocketId, acceptTimestamp } = offer;

    this.stateService.updateDriver(client.id, { state: DriverState.SEARCHING });
    super.updateRide({ pid: ridePID }, { driver: null });

    const isSafeCancel = this.isSafeCancel(acceptTimestamp as number, now);

    const status = isSafeCancel
      ? CANCELATION_RESPONSE.SAFE
      : CANCELATION_RESPONSE.PENDENCIE_ISSUED;

    this.socketService.emit(requesterSocketId, EVENTS.CANCELED_RIDE, {
      ridePID,
      status,
    });

    /**
     * No safe cancel, issue a pendencie
     */
    if (!isSafeCancel)
      this.createPendencie({
        ride: ride._id,
        issuer: ride.driver,
        affected: ride.voyager,
      });

    return { status };
  }
}
