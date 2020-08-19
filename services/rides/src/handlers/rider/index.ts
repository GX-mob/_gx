import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { Setup } from "../../schemas/events/setup";

export class Rider extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    this.on("position", (position) => {
      io.state.riders.setPosition(this.self.pid, position);
    });

    socket.on("setup", async ({ position, configuration }: Setup) => {
      const data = await this.get();

      io.state.riders.setupDriver({
        socketId: socket.id,
        firstName: this.self.firstName,
        lastName: this.self.lastName,
        pid: this.self.pid,
        rate: this.self.averageEvaluation,
        p2p: false,
        position,
        config: configuration,
        state: data.state || 1,
      });
    });

    socket.on("configuration", (configuration) => {
      io.state.riders.setConfiguration(this.self.pid, configuration);
    });

    socket.on("offerReponse", (response) =>
      io.state.riders.offerResponse(socket.id, response)
    );
  }
}
