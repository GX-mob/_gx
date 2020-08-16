import { Server, Socket } from "socket.io";
import { Common } from "../common";

export class Voyager extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    socket.on("offerRide", (data) => this.offerRideEvent(data));
  }

  offerRideEvent(data: any) {}
}
