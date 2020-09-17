import { ForbiddenException } from "@nestjs/common";
import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  ConnectedSocket,
} from "@nestjs/websockets";
import { SocketService } from "@app/socket";
import { Server, Socket } from "socket.io";
import { SessionService } from "@app/session";
import { CacheService } from "@app/cache";
import { unique, storageAdapters, auth } from "extensor";
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
import { EVENTS, State, Position, EventsInterface } from "../events";
import { retryUnderHood } from "@app/helpers/util";
import { CANCELATION } from "../constants";
import {
  RideNotFoundException,
  UncancelableRideException,
} from "../exceptions";
import { PinoLogger } from "nestjs-pino";

export class Common implements OnGatewayInit<Server>, OnGatewayConnection {
  public role!: USERS_ROLES;

  constructor(
    readonly socketService: SocketService<EventsInterface>,
    readonly rideRepository: RideRepository,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: SessionService,
    readonly stateService: StateService,
    readonly cacheService: CacheService,
    readonly logger: PinoLogger,
  ) {
    logger.setContext(Common.name);
  }

  afterInit(server: Server) {
    auth.server(server, async ({ socket, data: { token, p2p } }) => {
      const session = await this.sessionService.verify(
        token,
        socket.handshake.address,
      );

      const hasPermission = this.sessionService.hasPermission(session, [
        this.role,
      ]);

      if (!hasPermission) {
        throw new ForbiddenException();
      }

      const { _id, pid, averageEvaluation } = session.user;

      socket.data = await this.stateService.setConnectionData(pid, {
        _id,
        pid,
        mode: this.role,
        p2p,
        rate: averageEvaluation,
        socketId: socket.id,
      });

      return true;
    });
    //unique(server, {
    //  storage: new storageAdapters.IORedis(this.cacheService.redis),
    //  onError: (socket, error) => this.logger.error(error, socket.id)
    //});
  }

  handleConnection(socket: Socket) {
    socket.auth.catch(this.logger.warn);
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

  dispachToObervers<K extends keyof EventsInterface>(
    event: keyof EventsInterface,
    client: Socket,
    data: EventsInterface[K],
    considerP2P = true,
  ) {
    const { observers, p2p: selfP2P } = client.data;

    data = this.signObservableEvent(data, client);

    observers.forEach((observer) => {
      if (considerP2P && selfP2P && observer.p2p) {
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
    ride: Ride["_id"];
    issuer: User["_id"];
    affected: User["_id"];
  }) {
    return retryUnderHood(
      () =>
        this.pendencieRepository.create({
          issuer,
          affected,
          amount: CANCELATION.FARE,
          ride,
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

  isSafeCancel(acceptTimestamp: number, now: number) {
    return (acceptTimestamp as number) + CANCELATION.SAFE_TIME_MS > now;
  }
}
