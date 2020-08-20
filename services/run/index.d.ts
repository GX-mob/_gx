import { Session } from "@gx-mob/http-service/dist/models";
import { Riders, Offers } from "./src/state";
import { EventEmitter } from "events";
import { Connection } from "./src/schemas/common/connection";

declare module "socket.io" {
  interface Server {
    state: {
      riders: Riders;
      offers: Offers;
    };
  }
  interface Socket {
    connection: Connection;
  }

  interface ServerOptions {
    parser: any;
  }
}
