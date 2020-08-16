import { Session } from "@gx-mob/http-service/dist/models";
import { EventEmitter } from "events";

declare module "socket.io" {
  interface Socket {
    access: number;
    session: Session;
  }

  interface ServerOptions {
    parser: any;
  }
}
