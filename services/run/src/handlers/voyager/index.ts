import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { OfferRequest } from "../../schemas/events/offer";
import Node from "../../";

export class Voyager extends Common {
  constructor(public node: Node, public io: Server, public socket: Socket) {
    super(node, io, socket);

    socket.on("offer", async (data, ack) => {
      const result = await this.offerRideEvent(data);

      ack(result);
    });

    socket.on("amIrunning", (ack) => {
      ack(socket.connection.rides);
    });
  }

  offerRideEvent(offer: OfferRequest) {
    try {
      return this.io.state.offers.offer(offer, this.socket.id);
    } catch (error) {
      this.node.instance.log.error(error);
      return "internal";
    }
  }
}
