import {
  MessageBody,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { EventEmitter } from "eventemitter3";
import { SocketService, SocketModule } from "@app/socket";
import { Position } from "../schemas/events/position";
import { Connection } from "../schemas/common/connection";
import { Server, Socket } from "socket.io";
import { Module } from "@nestjs/common";
import { USERS_ROLES } from "@app/database";
import { CacheModule, CacheService } from "@app/cache";
import { SessionModule, SessionService } from "@app/session";
import { CACHE_NAMESPACES, CACHE_TTL } from "../constants";
import { auth } from "extensor";

declare module "socket.io" {
  interface Socket {
    connection: Connection;
  }
}

@Module({ imports: [CacheModule, SessionModule, SocketModule] })
export class Common
  extends EventEmitter
  implements
    OnGatewayInit<Server>,
    OnGatewayConnection<Socket>,
    OnGatewayDisconnect<Socket> {
  public role!: USERS_ROLES;

  constructor(
    readonly socketService: SocketService,
    readonly cacheService: CacheService,
    readonly sessionService: SessionService,
  ) {
    super();
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
        throw new Error("unauthorized");
      }

      const { pid, averageEvaluation } = session.user;
      const previous = await this.getConnection(pid);

      const connection: Connection = {
        _id: session.user._id,
        pid,
        mode: this.role,
        p2p,
        observers: previous.observers || [],
        rate: averageEvaluation,
        socketId: socket.id,
      };

      await this.setConnection(pid, connection);

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

  @SubscribeMessage("position")
  async positionEventHandler(
    @MessageBody() position: Position,
    @ConnectedSocket() client: Socket,
  ) {
    this.emit("position", position);
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

  /**
   * Get connection data
   * @param id Socket ID or User public ID
   */
  public getConnection(id: string): Promise<Connection> {
    return this.cacheService.get(CACHE_NAMESPACES.CONNECTIONS, id);
  }

  /**
   * Set connection data
   * @param pid User public ID
   * @param data
   */
  public async setConnection(
    pid: string,
    data: Connection,
  ): Promise<Connection> {
    const previousData = await this.cacheService.get(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );

    const newData = { ...previousData, ...data };

    await this.cacheService.set(CACHE_NAMESPACES.CONNECTIONS, pid, newData, {
      link: ["socketId"],
      ex: CACHE_TTL.CONNECTIONS,
    });
    return newData;
  }
}
