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
import { auth, storageAdapters, unique } from "extensor";
import { StateService } from "../state.service";
import { UserInterface, RideInterface, UserRoles } from "@shared/interfaces";
import {
  PendencieRepository,
  RideRepository,
  RideUpdateInterface,
  RideQueryInterface,
} from "@app/repositories";
import { EVENTS, State, Position, EventsInterface } from "@shared/events";
import { retryUnderHood } from "@app/helpers/util";
import { CANCELATION } from "../constants";
import { NotInRideException, RideNotFoundException } from "../exceptions";
import { PinoLogger } from "nestjs-pino";
import { ConfigService } from "@nestjs/config";

export class Common implements OnGatewayInit<Server>, OnGatewayConnection {
  public role!: UserRoles;

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
        rides: [],
      });

      return true;
    });

    if (process.env.NODE_ENV === "production") {
      unique(server, {
        storage: new storageAdapters.IORedis(this.cacheService.redis),
        onError: (local, error, socket) =>
          this.logger.error(error.message, { local, socketId: socket.id }),
      });
    }
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
    ride: RideInterface["_id"];
    issuer: UserInterface["_id"];
    affected: UserInterface["_id"];
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

  async getRide(query: RideQueryInterface): Promise<RideInterface> {
    const ride = await this.rideRepository.get(query);

    if (!ride) {
      throw new RideNotFoundException();
    }

    return ride;
  }

  checkIfInRide(ride: RideInterface, _id: UserInterface["_id"]) {
    if (ride.voyager._id !== _id && ride.driver?._id !== _id) {
      throw new NotInRideException(ride.pid, _id);
    }
  }

  isSafeCancel(acceptTimestamp: number, now: number) {
    const cancelationSafeTime = this.configService.get(
      "OFFER.SAFE_CANCELATION_WINDOW",
    ) as number;
    return acceptTimestamp + cancelationSafeTime > now;
  }
}
