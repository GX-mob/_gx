import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
} from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Socket } from "socket.io";
import { CacheService } from "@app/cache";
import { AuthService } from "@app/auth";
import { SocketService } from "@app/socket";
import {
  ERideFlowEvents,
  IRideFlowEvents,
  IPositionData,
  IOfferRequest,
  ICancelRide,
  EUserState,
} from "@core/ride-flow/events";
import { UncancelableRideException } from "../exceptions";
import { GatewayNamespaces } from "../constants";
import { ConnectionService, DriversService, RidesService } from "../state";
import { Common } from "./common";
import { EAccountRoles } from "@core/domain/account";
import { ERideStatus } from "@core/domain/ride";

@WebSocketGateway({ namespace: GatewayNamespaces.Voyagers })
export class VoyagersGateway extends Common {
  role = EAccountRoles.Voyager;
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
    logger.setContext(VoyagersGateway.name);
  }

  @SubscribeMessage(ERideFlowEvents.Position)
  positionEventHandler(
    @MessageBody() position: IPositionData,
    @ConnectedSocket() socket: Socket,
  ) {
    super.positionEventHandler(position, socket);
  }

  @SubscribeMessage(ERideFlowEvents.Offer)
  async offerEventHandler(
    @MessageBody() offer: IOfferRequest,
    @ConnectedSocket() client: Socket,
  ) {
    await this.ridesService.createOffer(offer, client);
    return true;
  }

  @SubscribeMessage(ERideFlowEvents.AmIRunning)
  amIRunningHandler(@ConnectedSocket() socket: Socket) {
    return socket.data.rides;
  }

  @SubscribeMessage(ERideFlowEvents.CancelRide)
  async cancelRideEventHandler(
    @MessageBody() { ridePID }: ICancelRide,
    @ConnectedSocket() socket: Socket,
  ) {
    const ride = await this.ridesService.getRide({ pid: ridePID });

    const { _id, rides } = socket.data;

    this.ridesService.checkIfInRide(ride, _id);

    // block cancel running ride
    if (ride.status === ERideStatus.Running) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    const offer = await this.ridesService.getOfferData(ridePID);
    const { driverSocketId } = offer;

    // remove the ride from user rides list
    const rideIdx = rides.indexOf(ride.pid);

    if (rideIdx > -1) {
      rides.splice(rideIdx, 1);
    }

    this.driversService.updateDriver(socket.id, {
      state: EUserState.SEARCHING,
    });
    this.socketService.emit(
      driverSocketId as string,
      ERideFlowEvents.CancelRide,
      {
        ridePID,
      },
    );
    this.ridesService.updateRide(
      { pid: ridePID },
      { status: ERideStatus.Canceled },
    );
  }
}
