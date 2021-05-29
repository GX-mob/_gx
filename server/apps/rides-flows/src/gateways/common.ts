import { ForbiddenException } from "@nestjs/common";
import { OnGatewayInit, OnGatewayConnection } from "@nestjs/websockets";
import { PinoLogger } from "nestjs-pino";
import { Server, Socket } from "socket.io";
import { auth, storageAdapters, unique } from "extensor";
import { SocketService } from "@app/socket";
import { AuthService } from "@app/auth";
import { CacheService } from "@app/cache";
import {
  ERideFlowEvents,
  IState,
  IPositionData,
  IRideFlowEvents,
  EUserState,
  IObserver,
} from "@core/events";
import { ConnectionService } from "../state";
import { EAccountRoles } from "@core/domain/account";

export class Common implements OnGatewayInit<Server>, OnGatewayConnection {
  public role!: EAccountRoles;

  constructor(
    readonly socketService: SocketService<IRideFlowEvents>,
    //readonly pendencieRepository: PendencieRepository,
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
      const hasPermission = this.sessionService.hasPermission(
        session.getData(),
        [this.role],
      );

      if (!hasPermission) {
        throw new ForbiddenException();
      }

      const { _id, pid, averageEvaluation } = session.getData().user;
      const previousData = await this.connectionService.find(pid);

      if (previousData) {
        socket.data = await this.connectionService.updateByPid(pid, {
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
        state: EUserState.IDLE,
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

  positionEventHandler(position: IPositionData, socket: Socket) {
    this.dispachToObervers(ERideFlowEvents.Position, socket, position);
  }

  // @SubscribeMessage(CommonEvents.STATE)
  // stateEventHandler(
  //   @MessageBody() state: IState,
  //   @ConnectedSocket() socket: Socket,
  // ) {
  //   socket.state = state.state;
  //   this.dispachToObervers(CommonEvents.STATE, socket, state);
  // }

  dispachToObervers<K extends keyof IRideFlowEvents>(
    event: keyof IRideFlowEvents,
    client: Socket,
    data: IRideFlowEvents[K],
    considerP2P = true,
  ) {
    const { observers, p2p: selfP2P } = client.data;

    data = this.signObservableEvent(data, client);

    (observers as IObserver[]).forEach((observer) => {
      if (considerP2P && selfP2P && observer.p2p) {
        return;
      }

      this.socketService.emitByPid(observer.pid, event, data);
    });
  }

  signObservableEvent<T = any>(packet: T, socket: Socket): T {
    return { ...packet, pid: socket.data.pid };
  }
}
