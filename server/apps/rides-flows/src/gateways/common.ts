import { ForbiddenException } from "@nestjs/common";
import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  ConnectedSocket,
} from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Server, Socket } from "socket.io";
import { auth, storageAdapters, unique } from "extensor";
import { SocketService } from "@app/socket";
import { AuthService } from "@app/auth";
import { CacheService } from "@app/cache";
import { retryUnderHood } from "@app/helpers/util";
import { IUser, IRide, UserRoles } from "@shared/interfaces";
import { PendencieRepository } from "@app/repositories";
import {
  EVENTS,
  State,
  Position,
  EventsInterface,
  UserState,
} from "@shared/events";
import { CANCELATION } from "../constants";
import { ConnectionService } from "../state";

export class Common implements OnGatewayInit<Server>, OnGatewayConnection {
  public role!: UserRoles;

  constructor(
    readonly socketService: SocketService<EventsInterface>,
    readonly pendencieRepository: PendencieRepository,
    readonly sessionService: AuthService,
    readonly connectionService: ConnectionService,
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
      const previousData = await this.connectionService.find(pid);

      if (previousData) {
        socket.data = await this.connectionService.update(pid, {
          socketId: socket.id,
        });

        return true;
      }

      socket.data = await this.connectionService.set(pid, {
        _id,
        pid,
        p2p,
        mode: this.role,
        rate: averageEvaluation,
        socketId: socket.id,
        state: UserState.IDLE,
        rides: [],
        observers: [],
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

  public createPendencie({
    ride,
    issuer,
    affected,
  }: {
    ride: IRide["_id"];
    issuer: IUser["_id"];
    affected: IUser["_id"];
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
}
