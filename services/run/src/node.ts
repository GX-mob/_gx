import { FastifyInstance } from "fastify";
import { FastifyInstanceToken, Inject } from "fastify-decorators";
import { Server } from "socket.io";
import { SessionService, CacheService } from "@gx-mob/http-service";
import { auth } from "extensor";
import { NAMESPACES } from "./constants";
import { Voyager } from "./handlers/voyager";
import { Rider } from "./handlers/rider";
import { Offers, Riders } from "./state";
import { Connection } from "./schemas/common/connection";
import { ParsersList } from "extensor/dist/types";

export default class Node {
  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  @Inject(SessionService)
  public session!: SessionService;

  @Inject(CacheService)
  public cache!: CacheService;

  constructor(io: Server, parser: ParsersList) {
    io.state = {
      riders: new Riders(this, io, parser),
      offers: new Offers(this, io, parser),
    };

    auth.server(io, async ({ socket, data: { mode, token, p2p } }) => {
      const session = await this.session.verify(
        token,
        socket.handshake.address
      );

      const hasPermission = this.session.hasPermission(session, [mode]);

      if (!hasPermission) {
        throw new Error("unauthorized");
      }

      const { pid, averageEvaluation } = session.user;
      const previous = await this.getConnection(pid);

      const connection: Connection = {
        _id: session.user._id,
        pid,
        mode,
        p2p,
        observers: previous.observers || [],
        rate: averageEvaluation,
        socketId: socket.id,
      };

      await this.setConnection(pid, connection);

      socket.connection = connection;

      return true;
    });

    io.on("connection", (socket) => {
      switch (socket.connection.mode) {
        case NAMESPACES.VOYAGER:
          new Voyager(this, io, socket);
        case NAMESPACES.RIDER:
          new Rider(this, io, socket);
      }
    });
  }

  /**
   * Get connection data
   * @param id Socket ID or User public ID
   */
  public getConnection(id: string): Promise<Connection> {
    return this.cache.get("rides:connections", id);
  }

  /**
   * Set connection data
   * @param pid User public ID
   * @param data
   */
  public async setConnection(pid: string, data: Connection) {
    return this.cache.set("rides:connections", pid, data, {
      link: ["socketId"],
      ex: 1000 * 60 * 60 * 5, // store for 5 hours
    });
  }
}
