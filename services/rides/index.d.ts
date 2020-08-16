import { Session } from "@gx-mob/http-service/dist/models";
import { EventEmitter } from "events";

declare module "socket.io" {
  interface Socket {
    access: number;
    session: Session;
    /**
     * Sockets that observe some events of this socket
     */
    observers: string[];
  }

  interface ServerOptions {
    parser: any;
  }
}
