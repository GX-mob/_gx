import { Injectable } from "@nestjs/common";
import { ConnectionData, EventsInterface } from "@shared/events";
import { CacheService } from "@app/cache";
import { CACHE_NAMESPACES, CACHE_TTL, NAMESPACES } from "../constants";
import { ConnectionDataNotFoundException } from "../exceptions";
import { SocketService } from "@app/socket";
import { INodesEvents, NODES_EVENTS } from "../events/nodes";

@Injectable()
export class ConnectionService {
  constructor(
    private cacheService: CacheService,
    readonly socketService: SocketService<EventsInterface, INodesEvents>,
  ) {}

  async set(pid: string, data: ConnectionData) {
    await this.cacheService.set(CACHE_NAMESPACES.CONNECTIONS, pid, data, {
      ex: CACHE_TTL.CONNECTIONS,
      link: [data.socketId as string],
    });
    return data;
  }

  find(pid: string) {
    return this.cacheService.get<ConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );
  }

  async get(pid: string) {
    const connection = await this.cacheService.get<ConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
    );

    if (!connection) {
      throw new ConnectionDataNotFoundException(pid);
    }

    return connection;
  }

  async update(pid: string, data: Partial<ConnectionData>) {
    return this.cacheService.update<ConnectionData>(
      CACHE_NAMESPACES.CONNECTIONS,
      pid,
      data,
      {
        ex: CACHE_TTL.CONNECTIONS,
      },
    );
  }

  async insertObserver(
    connectionPid: string | ConnectionData,
    observer: ConnectionData["observers"][0],
  ) {
    const connection =
      typeof connectionPid === "string"
        ? await this.get(connectionPid)
        : connectionPid;
    const updatedObservers = [...connection.observers, observer];

    await this.set(connection.pid, {
      ...connection,
      observers: updatedObservers,
    });

    this.socketService.nodes.emit(NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA, {
      socketId: connection.socketId,
      namespace: NAMESPACES.VOYAGERS,
      data: { observers: updatedObservers },
    });
  }
}
