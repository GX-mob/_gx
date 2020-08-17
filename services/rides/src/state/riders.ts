import { Server } from "socket.io";
import { UserBasic } from "../schemas/common/user-basic";
import { Position } from "../schemas/events/position";
import { OfferServer } from "../schemas/events/offer";
import { OfferResponse } from "../schemas/events/offer-response";
import { ParsersList } from "extensor/dist/types";

export class Riders {
  public list: { [id: string]: UserBasic & Position } = {};

  constructor(public io: Server, public parser: ParsersList) {
    io.nodes.on("offerResponse", ({ socketId, data }) => {
      if (socketId in io.sockets) {
        this.offerResponse(socketId, data);
      }
    });
  }

  setPosition(pid: string, position: UserBasic & Position) {
    this.list[pid] = position;
  }

  async offer(offer: OfferServer, socketId: string): Promise<void> {
    const rider = await this.match(offer, socketId);

    offer.trys++;

    /**
     * If don't have a match, rerun match algorithm
     */
    if (!rider) {
      return this.offer(offer, socketId);
    }

    /**
     * Inform the user that we have a compatible driver and we awaiting his response
     */
    this.emit(socketId, "offerSent", rider);

    /**
     * Define a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(() => {
      offer.ignoreds.push(rider.pid);
      this.offer(offer, socketId);
    }, 13000);
  }

  async match(offer: OfferServer, socketId: string): Promise<UserBasic | null> {
    if (offer.accepted) {
      return null;
    }

    return null;
  }

  /**
   * Emit event to a socket
   */
  emit(socketId: string, event: string, data: any) {
    this.io.nodes.emit(event, socketId, data);
  }

  /**
   * Handle driver offer response
   */
  offerResponse(socketId: string, response: OfferResponse) {}
}
