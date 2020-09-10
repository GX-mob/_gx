import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { SocketService, SocketModule } from "@app/socket";
import { Server, Socket } from "socket.io";
import { Module } from "@nestjs/common";
import { USERS_ROLES, Ride, User } from "@app/database";
import { CacheModule, CacheService } from "@app/cache";
import { SessionModule, SessionService } from "@app/session";
import { auth } from "extensor";
import { StateService } from "../state.service";
import { DataModule, DataService } from "@app/data";
import { EVENTS, State, Position, Connection } from "../events";
import { util } from "@app/helpers";
import { CANCELATION } from "../constants";
declare module "socket.io" {
  interface Socket {
    connection: Connection;
  }
}

@Module({
  imports: [CacheModule, DataModule, SessionModule, SocketModule],
  providers: [StateService],
})
export class Common
  implements
    OnGatewayInit<Server>,
    OnGatewayConnection<Socket>,
    OnGatewayDisconnect<Socket> {
  public role!: USERS_ROLES;

  constructor(
    readonly socketService: SocketService,
    readonly cacheService: CacheService,
    readonly dataService: DataService,
    readonly sessionService: SessionService,
    readonly stateService: StateService,
  ) {}

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
        throw new Error("unauthorized");
      }

      const { pid, averageEvaluation } = session.user;

      socket.connection = await this.stateService.setConnectionData(pid, {
        _id: session.user._id,
        pid,
        mode: this.role,
        p2p,
        rate: averageEvaluation,
        socketId: socket.id,
      });

      return true;
    });
  }

  handleConnection(socket: Socket) {
    console.log("client connected", socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log("client disconected", socket.id);
  }

  positionEventHandler(position: Position, client: Socket) {
    this.dispachToObervers("position", client, position);
  }

  @SubscribeMessage(EVENTS.STATE)
  stateEventHandler(
    @MessageBody() state: State,
    @ConnectedSocket() client: Socket,
  ) {
    // client.connection.state = state.state;
    this.dispachToObervers("state", client, state);
  }

  dispachToObervers<T = any>(
    event: string,
    client: Socket,
    data: T,
    considerP2P = true,
  ) {
    const { observers } = client.connection;

    data = this.signObservableEvent(data, client);

    observers.forEach((observer) => {
      if (considerP2P && observer.p2p) {
        return;
      }

      this.socketService.emit(observer.socketId, event, data);
    });
  }

  signObservableEvent<T = any>(packet: T, client: Socket): T {
    return { ...packet, pid: client.connection.pid };
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
    return util.retry(
      () =>
        this.dataService.pendencies.create({
          issuer,
          affected,
          amount: CANCELATION.FARE,
          ride: ride._id,
        }),
      3,
      500,
    );
  }
}
