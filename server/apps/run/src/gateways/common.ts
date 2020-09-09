import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { SocketService, SocketModule } from "@app/socket";
import { Position } from "../schemas/events/position";
import { Connection } from "../schemas/common/connection";
import { Server, Socket } from "socket.io";
import { Module } from "@nestjs/common";
import { USERS_ROLES } from "@app/database";
import { CacheModule, CacheService } from "@app/cache";
import { SessionModule, SessionService } from "@app/session";
import { auth } from "extensor";
import { OffersState } from "../states/offers.state";
import { DriversState } from "../states/drivers.state";
import { ConnectionDataService } from "../conn-data.service";

import { DataModule, DataService } from "@app/data";
declare module "socket.io" {
  interface Socket {
    connection: Connection;
  }
}

@Module({
  imports: [CacheModule, DataModule, SessionModule, SocketModule],
  providers: [DriversState, OffersState, ConnectionDataService],
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
    readonly sessionService: SessionService,
    readonly driversState: DriversState,
    readonly offersState: OffersState,
    readonly connectionData: ConnectionDataService,
  ) {}

  afterInit(server: Server) {
    auth.server(server, async ({ socket, data: { token, p2p } }) => {
      console.log("@@@", socket.id, token);
      if (token === "fooba") return true;

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
      const previous = await this.connectionData.get(pid);

      const connection: Connection = {
        _id: session.user._id,
        pid,
        mode: this.role,
        p2p,
        observers: previous.observers || [],
        rate: averageEvaluation,
        socketId: socket.id,
      };

      await this.connectionData.set(pid, connection);

      (socket as any).connection = connection;

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
    this.dispachToObervers(
      "position",
      client,
      this.signObservableEvent(position, client),
    );
  }

  dispachToObervers<T = any>(
    event: string,
    client: Socket,
    data: T,
    considerP2P = true,
  ) {
    const { observers } = client.connection;
    for (let i = 0; i < observers.length; ++i) {
      if (considerP2P && observers[i].p2p) {
        continue;
      }
      this.socketService.emit(observers[i].socketId, event, data);
    }
  }

  signObservableEvent<T = any>(packet: T, client: Socket): T {
    return { ...packet, pid: client.connection.pid };
  }
}
