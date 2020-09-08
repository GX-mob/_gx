import { INestApplication } from "@nestjs/common";
import { USERS_ROLES } from "@app/database";
import { SocketAdapter } from "@app/socket";
import { parsers, auth } from "extensor";
import { schemas } from "./schemas";
import { SessionService } from "@app/session";
import { CacheService } from "@app/cache";
import { Connection } from "./schemas/common/connection";

import { CACHE_NAMESPACES, CACHE_TTL } from "./constants";
import { ConfigOptions } from "@app/socket/types";
import { Namespace, Server } from "socket.io";

export class SocketNode extends SocketAdapter {
  sessionService: SessionService;
  cacheService: CacheService;

  constructor(app: INestApplication, config: ConfigOptions) {
    super(app, config);

    this.sessionService = app.get(SessionService);
    this.cacheService = app.get(CacheService);
  }

  createIOServer(port: number, options: any = {}): any {
    const server = super.createIOServer(port, { ...options });

    const driverNamespace = server.of("/driver");
    const voyagerNamespace = server.of("/driver");

    this.createAuthMiddleware(driverNamespace, USERS_ROLES.DRIVER);
    this.createAuthMiddleware(voyagerNamespace, USERS_ROLES.VOYAGER);

    

    return server;
  }

  private createAuthMiddleware(namespace: Server, role: USERS_ROLES){
    auth.server(namespace, async ({ socket, data: { token, p2p } }) => {
      const session = await this.sessionService.verify(
        token,
        socket.handshake.address,
      );

      const hasPermission = this.sessionService.hasPermission(session, [role]);

      if (!hasPermission) {
        throw new Error("unauthorized");
      }

      const { pid, averageEvaluation } = session.user;
      const previous = await this.getConnection(pid);

      const connection: Connection = {
        _id: session.user._id,
        pid,
        mode: role,
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
