import { Server } from "socket.io";
import { Inject } from "fastify-decorators";
import { CacheService } from "@gx-mob/http-service";
import { Offer, OfferServer } from "../schemas/events/offer";
import { ParsersList } from "extensor/dist/types";
import shortid from "shortid";

export class Offers {
  @Inject(CacheService)
  public cache!: CacheService;

  public offers: { [id: string]: OfferServer } = {};

  constructor(public io: Server, public parser: ParsersList) {}

  async offer(offer: Offer, socketId: string) {
    const id = shortid.generate();

    this.offers[id] = {
      ...offer,
      id,
      ignoreds: [],
      recused: [],
      accepted: false,
      routeSent: false,
      sendBuff: this.parser.offer.encode(offer),
      trys: 0,
    };

    await this.save(this.offers[id]);

    this.io.state.riders.offer(this.offers[id], socketId);
  }

  save(offer: OfferServer) {
    return this.cache.set("rides:offer", offer.id, offer);
  }
}
