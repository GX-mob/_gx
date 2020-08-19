import { Inject } from "fastify-decorators";
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
  @Inject(SessionService)
  private session!: SessionService;

  @Inject(CacheService)
  private cache!: CacheService;

  constructor(io: Server, parser: ParsersList) {
    io.state = {
      riders: new Riders(this, io, parser),
      offers: new Offers(this, io, parser),
    };

    auth.server(io, async ({ socket, data: { access, token, p2p } }) => {
      socket.session = await this.session.verify(
        token,
        socket.handshake.address
      );

      const hasPermission = this.session.hasPermission(socket.session, [
        access,
      ]);

      if (!hasPermission) {
        throw new Error("unauthorized");
      }

      socket.access = access;

      const {
        pid,
        firstName,
        lastName,
        averageEvaluation,
      } = socket.session.user;

      const observers = (await this.getConnection(pid)).observers || [];

      await this.setConnection(pid, {
        pid,
        firstName,
        lastName,
        p2p,
        observers,
        rate: averageEvaluation,
        socketId: socket.id,
      });

      socket.observers = observers;

      return true;
    });

    io.on("connection", (socket) => {
      switch (socket.access) {
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
   */
  public setConnection(pid: string, data: Connection) {
    return this.cache.set("rides:connections", pid, data, {
      link: ["socketId"],
      ex: 1000 * 60 * 60,
    });
  }
}
