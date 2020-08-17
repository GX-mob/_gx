import { Session } from "@gx-mob/http-service/dist/models";
import { Riders, Offers } from "./src/state";
import { EventEmitter } from "events";

declare module "socket.io" {
  interface Server {
    state: {
      riders: Riders;
      offers: Offers;
    };
  }
  interface Socket {
    access: number;
    session: Session;
    /**
     * Sockets that observe some events of this socket
     */
    observers: { socketId: string; p2p: boolean }[];
  }

  interface ServerOptions {
    parser: any;
  }
}
