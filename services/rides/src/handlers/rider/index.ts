import { Socket } from "socket.io";
import { Common } from "../common";

export class Rider extends Common {
  constructor(public socket: Socket) {
    super(socket);
  }
}
