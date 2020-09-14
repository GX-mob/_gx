import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  ConnectedSocket,
} from "@nestjs/websockets";
import { SocketService } from "@app/socket";
import { Server, Socket } from "socket.io";
import { SessionService } from "@app/session";
import { CacheService } from "@app/cache";
import { auth, unique, storageAdapters } from "extensor";
import { StateService } from "../state.service";
import {
  PendencieRepository,
  Ride,
  User,
  USERS_ROLES,
  RideRepository,
  RideUpdateInterface,
  RideQueryInterface,
  RideStatus,
} from "@app/repositories";
import { EVENTS, State, Position, Events } from "../events";
import { retryUnderHood } from "@app/helpers/util";
import { CANCELATION } from "../constants";

import {
  RideNotFoundException,
  UncancelableRideException,
} from "../exceptions";
import { UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "@app/auth";

@UseGuards(WsAuthGuard)
export class Common implements OnGatewayInit<Server> {
  public role!: USERS_ROLES;

  constructor(
    readonly socketService: SocketService<Events>,
    readonly rideRepository: RideRepository,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: SessionService,
    readonly stateService: StateService,
    readonly cacheService: CacheService,
  ) {}

  afterInit(server: Server) {
    unique(server, {
      storage: new storageAdapters.IORedis(this.cacheService.redis),
    });
  }

  positionEventHandler(position: Position, socket: Socket) {
    this.dispachToObervers(EVENTS.POSITION, socket, position);
  }

  @SubscribeMessage(EVENTS.STATE)
  stateEventHandler(
    @MessageBody() state: State,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.state = state.state;
    this.dispachToObervers(EVENTS.STATE, socket, state);
  }

  dispachToObervers<K extends keyof Events>(
    event: keyof Events,
    client: Socket,
    data: Events[K],
    considerP2P = true,
  ) {
    const { observers } = client.data;

    data = this.signObservableEvent(data, client);

    observers.forEach((observer) => {
      if (considerP2P && observer.p2p) {
        return;
      }

      this.socketService.emit(observer.socketId, event, data);
    });
  }

  signObservableEvent<T = any>(packet: T, socket: Socket): T {
    return { ...packet, pid: socket.data.pid };
  }

  public updateRide(query: RideQueryInterface, data: RideUpdateInterface) {
    return retryUnderHood(() => this.rideRepository.update(query, data));
  }

  public createPendencie({
    ride,
    issuer,
    affected,
  }: {
    ride: Ride;
    issuer: User["_id"];
    affected: User["_id"];
  }) {
    return retryUnderHood(
      () =>
        this.pendencieRepository.create({
          issuer,
          affected,
          amount: CANCELATION.FARE,
          ride: ride._id,
        }),
      3,
      500,
    );
  }

  cancelationSecutiryChecks(
    ride: Ride | null,
    _id: User["_id"],
    target: keyof Pick<Ride, "voyager" | "driver">,
  ) {
    if (!ride) {
      throw new RideNotFoundException();
    }

    // block cancel running ride
    if (ride.status === RideStatus.RUNNING) {
      throw new UncancelableRideException(ride.pid, "running");
    }

    if (ride[target] !== _id) {
      throw new UncancelableRideException(ride.pid, "not-in-ride");
    }
  }
}
