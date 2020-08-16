import { Server, Socket } from "socket.io";
import { Common } from "../common";
import { OfferRide } from "../../schemas/events/offer-ride";

export class Voyager extends Common {
  constructor(public io: Server, public socket: Socket) {
    super(io, socket);

    socket.on("offerRide", (data) => this.offerRideEvent(data));
  }

  offerRideEvent(offer: OfferRide) {
    this.io.state.Riders.offer(offer);
  }
}
