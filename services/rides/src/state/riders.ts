import { Server } from "socket.io";
import { OfferRide } from "../schemas/events/offer-ride";

export class Riders {
  public list = {};

  constructor(io: Server) {}

  offer(offer: OfferRide) {}
}
