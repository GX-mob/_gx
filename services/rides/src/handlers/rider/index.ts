import { Server, Socket } from "socket.io";
import { Common } from "../common";

export class Rider extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    io.state.riders.setSocketIdPidRef(socket.id, this.self.pid);

    this.on("position", (position) => {
      io.state.riders.setPosition(this.self.pid, position);
    });

    socket.on("configuration", (configuration) => {
      io.state.riders.setConfiguration(this.self.pid, configuration);
    });

    socket.on("offerReponse", (response) =>
      io.state.riders.offerResponse(socket.id, response)
    );
  }
}
