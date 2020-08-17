import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { Offer } from "../../schemas/events/offer";

export class Voyager extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    socket.on("offerRide", (data) => this.offerRideEvent(data));
  }

  offerRideEvent(offer: Offer) {
    this.io.state.offers.offer(offer, this.socket.id);
  }
}
