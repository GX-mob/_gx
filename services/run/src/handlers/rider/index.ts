import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { Setup } from "../../schemas/events/setup";
import Node from "../../node";

export class Rider extends Common {
  constructor(public node: Node, public io: Server, public socket: Socket) {
    super(node, io, socket);

    this.on("position", (position) => {
      io.state.riders.setPosition(socket.connection.pid, position);
    });

    socket.on("setup", async (setup: Setup, ack) => {
      io.state.riders.setupDriver(socket.id, setup, socket.connection);
      ack(socket.connection.state);
    });

    socket.on("configuration", (configuration) => {
      io.state.riders.setConfiguration(socket.connection.pid, configuration);
    });

    socket.on("offerReponse", (response) => {
      io.state.riders.offerResponse(socket.id, response);
    });

    socket.on("cancelRide", async (pid, ack) => {
      try {
        await this.cancelRide(pid);
        ack(true);
      } catch (error) {
        this.node.instance.log.error(error);
        ack(false);
      }
    });
  }

  async cancelRide(pid: string) {
    get

  }
}
