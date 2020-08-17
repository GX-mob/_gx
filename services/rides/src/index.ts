import { Inject } from "fastify-decorators";
import { Server } from "socket.io";
import { SessionService } from "@gx-mob/http-service";
import { auth } from "extensor";
import { NAMESPACES } from "./constants";
import { Voyager } from "./handlers/voyager";
import { Rider } from "./handlers/rider";
import { Offers, Riders } from "./state";
import { ParsersList } from "extensor/dist/types";

export default class InitNode {
  @Inject(SessionService)
  private session!: SessionService;

  constructor(io: Server, parser: ParsersList) {
    io.state = {
      riders: new Riders(io, parser),
      offers: new Offers(io, parser),
    };

    auth.server(io, async ({ socket, data: { access, token } }) => {
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
      socket.observers = [];

      return true;
    });

    io.on("connection", (socket) => {
      switch (socket.access) {
        case NAMESPACES.VOYAGER:
          new Voyager(io, socket);
        case NAMESPACES.RIDER:
          new Rider(io, socket);
      }
    });
  }
}
