import { Server, Socket } from "socket.io";
import { Common } from "../common";

export class Rider extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);
  }
}
