import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { OfferRequest } from "../../schemas/events/offer";
import Node from "../../";

export class Voyager extends Common {
  constructor(public node: Node, public io: Server, public socket: Socket) {
    super(node, io, socket);

    socket.on("offer", (data) => this.offerRideEvent(data));
  }

  offerRideEvent(offer: OfferRequest) {
    this.io.state.offers.offer(offer, this.socket.id);
  }
}
