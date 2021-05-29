import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Socket } from "socket.io";
import { CacheService } from "@app/cache";
import { AuthService } from "@app/auth";
import { SocketService } from "@app/socket";
import { geometry } from "@app/helpers";
import {
  ERideFlowEvents,
  IRideFlowEvents,
  IPositionData,
  ISetup,
  IConfiguration,
  IOfferResponse,
  ICancelRide,
  IGetOverHere,
  IStartRide,
  EUserState,
} from "@core/ride-flow/events";
import {
  UncancelableRideException,
  TooDistantOfExpectedException,
} from "../exceptions";
import {
  GatewayNamespaces,
  DISTANCE_TOLERANCE_TO_FINISH_RIDE,
  DISTANCE_TOLERANCE_TO_START_RIDE,
} from "../constants";
import { Common } from "./common";
import { ConnectionService, DriversService, RidesService } from "../state";
import { EAccountRoles } from "@core/domain/account";
import { ERideStatus } from "@core/domain/ride";

@WebSocketGateway({ namespace: GatewayNamespaces.Drivers })
export class DriversGateway extends Common implements OnGatewayDisconnect {
  role = EAccountRoles.Driver;

  constructor(
    readonly socketService: SocketService<IRideFlowEvents>,
    readonly sessionService: AuthService,
    readonly cacheService: CacheService,
    readonly connectionService: ConnectionService,
    readonly driversService: DriversService,
    readonly ridesService: RidesService,
    readonly logger: PinoLogger,
  ) {
    super(
      socketService,
      sessionService,
      connectionService,
      cacheService,
      logger,
    );

    logger.setContext(DriversGateway.name);
  }

  @SubscribeMessage(ERideFlowEvents.Position)
  positionEventHandler(
    @MessageBody() position: IPositionData,
    @ConnectedSocket() client: Socket,
  ) {
    super.positionEventHandler(position, client);
    this.driversService.positionEvent(client.id, position);
  }

  @SubscribeMessage(ERideFlowEvents.DriverSetup)
  async setupEventHandler(
    @MessageBody() setup: ISetup,
    @ConnectedSocket() client: Socket,
  ) {
    await this.driversService.setupDriverEvent(client.id, setup, client.data);
    return true;
  }

  @SubscribeMessage(ERideFlowEvents.Configuration)
  configurationEventHandler(
    @MessageBody() config: IConfiguration,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversService.setConfigurationEvent(client.id, config);
  }

  @SubscribeMessage(ERideFlowEvents.OfferResponse)
  async offerResponseEventHandler(
    @MessageBody() offerResponse: IOfferResponse,
    @ConnectedSocket() client: Socket,
  ) {
    this.driversService.offerResponseEvent(
      client.id,
      offerResponse,
      client.data,
    );
  }

  @SubscribeMessage(ERideFlowEvents.GetOverHere)
  async pickingUpPathEventHandler(
    @MessageBody() pickingUp: IGetOverHere,
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
      ERideFlowEvents.GetOverHere,
      pickingUp,
    );
  }

  @SubscribeMessage(ERideFlowEvents.StartRide)
  async startRideEventHandler(
    @MessageBody() { ridePID, latLng }: IStartRide,
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
      { status: ERideStatus.Running },
    );
    this.driversService.updateDriver(client.id, { state: EUserState.RUNNING });

    return true;
  }

  @SubscribeMessage(ERideFlowEvents.FinishRide)
  async finishRideEventHandler(
    @MessageBody() { ridePID, latLng }: IStartRide,
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
      { status: ERideStatus.Completed },
    );
    this.driversService.updateDriver(client.id, { state: EUserState.IDLE });

    return true;
  }

  @SubscribeMessage(ERideFlowEvents.CancelRide)
  async cancelRideEventHandler(
    @MessageBody() { ridePID }: ICancelRide,
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await this.ridesService.getRide({ pid: ridePID });
    const { _id } = client.data;

    this.ridesService.checkIfInRide(ride, _id);

    // block cancel running ride
    if (ride.status === ERideStatus.Running) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    const offer = await this.ridesService.getOfferData(ridePID);
    const { requesterSocketId } = offer;

    this.driversService.updateDriver(client.id, {
      state: EUserState.SEARCHING,
    });
    this.ridesService.updateRide({ pid: ridePID }, { driver: undefined });

    this.socketService.emit(requesterSocketId, ERideFlowEvents.CancelRide, {
      ridePID,
    });
  }

  handleDisconnect(client: Socket) {
    if (!client.data) return;

    switch (client.data.state) {
      case EUserState.SEARCHING:
      case EUserState.COMPLETING:
        return this.driversService.updateDriver(client.id, {
          state: EUserState.IDLE,
        });
    }
  }
}
