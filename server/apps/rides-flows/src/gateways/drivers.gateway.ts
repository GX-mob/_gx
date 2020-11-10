import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Socket } from "socket.io";
import { PendencieRepository } from "@app/repositories";
import { CacheService } from "@app/cache";
import { AuthService } from "@app/auth";
import { SocketService } from "@app/socket";
import { geometry } from "@app/helpers";
import { IPendencie, RideStatus, UserRoles } from "@shared/interfaces";
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
} from "@shared/events";
import {
  UncancelableRideException,
  TooDistantOfExpectedException,
} from "../exceptions";
import {
  NAMESPACES,
  DISTANCE_TOLERANCE_TO_FINISH_RIDE,
  DISTANCE_TOLERANCE_TO_START_RIDE,
} from "../constants";
import { Common } from "./common";
import { ConnectionService, DriversService, RidesService } from "../state";

@WebSocketGateway({ namespace: NAMESPACES.DRIVERS })
export class DriversGateway extends Common implements OnGatewayDisconnect {
  role = UserRoles.DRIVER;

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

    logger.setContext(DriversGateway.name);
  }

  @SubscribeMessage(EVENTS.POSITION)
  positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    super.positionEventHandler(position, client);
    this.driversService.positionEvent(client.id, position);
  }

  @SubscribeMessage(EVENTS.DRIVER_SETUP)
  async setupEventHandler(
    @MessageBody() setup: Setup,
    @ConnectedSocket() client: Socket,
  ) {
    await this.driversService.setupDriverEvent(client.id, setup, client.data);
    return true;
  }

  @SubscribeMessage(EVENTS.CONFIGURATION)
  configurationEventHandler(
    @MessageBody() config: Configuration,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversService.setConfigurationEvent(client.id, config);
  }

  @SubscribeMessage(EVENTS.OFFER_RESPONSE)
  async offerResponseEventHandler(
    @MessageBody() offerResponse: OfferResponse,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversService.offerResponseEvent(
      client.id,
      offerResponse,
      client.data,
    );
  }

  @SubscribeMessage(EVENTS.PICKING_UP_PATH)
  async pickingUpPathEventHandler(
    @MessageBody() pickingUp: PickingUpPath,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await this.ridesService.getRide({ pid: pickingUp.ridePID });
    this.ridesService.checkIfInRide(ride, client.data._id);

    const { requesterSocketId } = await this.ridesService.setOfferData(
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
    const ride = await this.ridesService.getRide({ pid: ridePID });
    this.ridesService.checkIfInRide(ride, client.data._id);

    if (
      geometry.distance.calculate(latLng, ride.route.start.coord) >
      DISTANCE_TOLERANCE_TO_START_RIDE
    ) {
      throw new TooDistantOfExpectedException("start");
    }

    this.ridesService.updateRide(
      { pid: ridePID },
      { status: RideStatus.RUNNING },
    );
    this.driversService.updateDriver(client.id, { state: UserState.RUNNING });

    return true;
  }

  @SubscribeMessage(EVENTS.FINISH_RIDE)
  async finishRideEventHandler(
    @MessageBody() { ridePID, latLng }: StartRide,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await this.ridesService.getRide({ pid: ridePID });
    this.ridesService.checkIfInRide(ride, client.data._id);

    if (
      geometry.distance.calculate(latLng, ride.route.end.coord) >
      DISTANCE_TOLERANCE_TO_FINISH_RIDE
    ) {
      throw new TooDistantOfExpectedException("end");
    }

    this.ridesService.updateRide(
      { pid: ridePID },
      { status: RideStatus.COMPLETED },
    );
    this.driversService.updateDriver(client.id, { state: UserState.IDLE });

    return true;
  }

  @SubscribeMessage(EVENTS.CANCEL_RIDE)
  async cancelRideEventHandler(
    @MessageBody() ridePID: CancelRide,
    @ConnectedSocket() client: Socket,
  ): Promise<{
    status: CanceledRide["status"] | "error";
    error?: string;
    pendencie?: IPendencie["_id"];
  }> {
    const now = Date.now();
    const ride = await this.ridesService.getRide({ pid: ridePID });
    const { _id } = client.data;

    this.ridesService.checkIfInRide(ride, _id);

    // block cancel running ride
    if (ride.status === RideStatus.RUNNING) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    const offer = await this.ridesService.getOfferData(ridePID);
    const { requesterSocketId, acceptTimestamp } = offer;

    this.driversService.updateDriver(client.id, {
      state: DriverState.SEARCHING,
    });
    this.ridesService.updateRide({ pid: ridePID }, { driver: undefined });

    const isSafeCancel = this.ridesService.isSafeCancel(
      acceptTimestamp as number,
      now,
    );

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

  handleDisconnect(client: Socket) {
    if (!client.data) return;

    switch (client.data.state) {
      case UserState.SEARCHING:
      case UserState.COMPLETING:
        return this.driversService.updateDriver(client.id, {
          state: UserState.IDLE,
        });
    }
  }
}
