import { Server, Socket } from "socket.io";
import { Common } from "../common";

export class Rider extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    this.on("position", (position) => {
      io.state.riders.setPosition(this.self.pid as string, position);
    });

    socket.on("offerReponse", (response) =>
      io.state.riders.offerResponse(socket.id, response)
    );
  }
}
