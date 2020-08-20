import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { Setup } from "../../schemas/events/setup";
import Node from "../../";

export class Rider extends Common {
  constructor(public node: Node, public io: Server, public socket: Socket) {
    super(node, io, socket);

    this.on("position", (position) => {
      io.state.riders.setPosition(socket.connection.pid, position);
    });

    socket.on("setup", async (setup: Setup) => {
      io.state.riders.setupDriver(socket.id, setup);
    });

    socket.on("configuration", (configuration) => {
      io.state.riders.setConfiguration(socket.connection.pid, configuration);
    });

    socket.on("offerReponse", (response) =>
      io.state.riders.offerResponse(socket.id, response)
    );
  }
}
