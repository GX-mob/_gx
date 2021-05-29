import { Injectable } from "@nestjs/common";
import { IConnectionData, IObserver, IRideFlowEvents } from "@core/events";
import { CacheService } from "@app/cache";
import { CACHE_NAMESPACES, CACHE_TTL, NAMESPACES } from "../constants";
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
    await this.cacheService.set(CACHE_NAMESPACES.CONNECTIONS, pid, data, {
      ex: CACHE_TTL.CONNECTIONS,
      link: [data.socketId as string],
    });
    return data;
  }

  find(pid: string) {
    return this.cacheService.get<IConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );
  }

  async getByPid(pid: string) {
    const connection = await this.cacheService.get<IConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );

    if (!connection) {
      throw new ConnectionDataNotFoundException(pid);
    }

    return connection;
  }

  async updateByPid(pid: string, data: Partial<IConnectionData>) {
    return this.cacheService.update<IConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
      data,
      {
        ex: CACHE_TTL.CONNECTIONS,
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
      namespace: NAMESPACES.VOYAGERS,
      data: { observers: connection.observers },
    });
  }
}
