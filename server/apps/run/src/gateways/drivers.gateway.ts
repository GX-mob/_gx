import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  WsException,
} from "@nestjs/websockets";
import { DISTANCE_TOLERANCE_TO_START_RIDE, NAMESPACES } from "../constants";
import { Common } from "./common";
import {
  Pendencie,
  PendencieRepository,
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
  StartRide,
  UserState,
} from "../events";
import { CacheService } from "@app/cache";
import { SessionService } from "@app/session";
import { SocketService } from "@app/socket";
import { StateService } from "../state.service";
import { PinoLogger } from "nestjs-pino";
import { ConfigService } from "@nestjs/config";
import {
  UncancelableRideException,
  TooDistantOfExpectedException,
} from "../exceptions";
import { geometry } from "@app/helpers";
import { DISTANCE_TOLERANCE_TO_FINISH_RIDE } from "../constants";

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
    super.checkIfInRide(ride, client.data._id);

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

  @SubscribeMessage(EVENTS.START_RIDE)
  async startRideEventHandler(
    @MessageBody() { ridePID, latLng }: StartRide,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await super.getRide({ pid: ridePID });
    super.checkIfInRide(ride, client.data._id);

    if (
      geometry.distance.calculate(latLng, ride.route.start.coord) >
      DISTANCE_TOLERANCE_TO_START_RIDE
    ) {
      throw new TooDistantOfExpectedException("start");
    }

    await this.rideRepository.update(
      { pid: ridePID },
      { status: RideStatus.RUNNING },
    );
    this.stateService.updateDriver(client.id, { state: UserState.RUNNING });

    return true;
  }

  @SubscribeMessage(EVENTS.FINISH_RIDE)
  async finishRideEventHandler(
    @MessageBody() { ridePID, latLng }: StartRide,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await super.getRide({ pid: ridePID });
    super.checkIfInRide(ride, client.data._id);

    if (
      geometry.distance.calculate(latLng, ride.route.end.coord) >
      DISTANCE_TOLERANCE_TO_FINISH_RIDE
    ) {
      throw new TooDistantOfExpectedException("end");
    }

    await this.rideRepository.update(
      { pid: ridePID },
      { status: RideStatus.COMPLETED },
    );
    this.stateService.updateDriver(client.id, { state: UserState.IDLE });

    return true;
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

    super.checkIfInRide(ride, _id);

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
