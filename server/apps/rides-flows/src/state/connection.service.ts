import { Injectable } from "@nestjs/common";
import { IConnectionData, IObserver, IRideFlowEvents } from "@core/ride-flow/events";
import { CacheService } from "@app/cache";
import { CacheNamespaces, CacheTTL, GatewayNamespaces } from "../constants";
import { ConnectionDataNotFoundException } from "../exceptions";
import { SocketService } from "@app/socket";
import { INodesEvents, EServerNodesEvents } from "../events/nodes";

@Injectable()
export class ConnectionService {
  constructor(
    private cacheService: CacheService,
    readonly socketService: SocketService<IRideFlowEvents, INodesEvents>,
  ) {}

  async set(pid: string, data: IConnectionData) {
    await this.cacheService.set(CacheNamespaces.CONNECTIONS, pid, data, {
      ex: CacheTTL.CONNECTIONS,
      link: [data.socketId as string],
    });
    return data;
  }

  find(pid: string) {
    return this.cacheService.get<IConnectionData>(
      CacheNamespaces.CONNECTIONS,
      pid,
    );
  }

  async getByPid(pid: string) {
    const connection = await this.cacheService.get<IConnectionData>(
      CacheNamespaces.CONNECTIONS,
      pid,
    );

    if (!connection) {
      throw new ConnectionDataNotFoundException(pid);
    }

    return connection;
  }

  async updateByPid(pid: string, data: Partial<IConnectionData>) {
    return this.cacheService.update<IConnectionData>(
      CacheNamespaces.CONNECTIONS,
      pid,
      data,
      {
        ex: CacheTTL.CONNECTIONS,
      },
    );
  }

  async insertObserver(
    connectionPid: string | IConnectionData,
    observer: IObserver,
  ) {
    const connection =
      typeof connectionPid === "string"
        ? await this.getByPid(connectionPid)
        : connectionPid;

    connection.observers.push(observer);

    await this.set(connection.pid, {
      ...connection,
      observers: connection.observers,
    });

    this.socketService.nodes.emit(EServerNodesEvents.UpdateLocalAccountData, {
      socketId: connection.socketId,
      namespace: GatewayNamespaces.Voyagers,
      data: { observers: connection.observers },
    });
  }
}
