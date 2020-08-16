import { Socket } from "socket.io";
import { Common } from "../common";

export class Voyager extends Common {
  constructor(public socket: Socket) {
    super(socket);
  }
}
