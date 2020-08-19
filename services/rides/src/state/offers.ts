import { Server } from "socket.io";
import { Inject } from "fastify-decorators";
import { CacheService } from "@gx-mob/http-service";
import { OfferRequest, OfferServer } from "../schemas/events/offer";
import { ParsersList } from "extensor/dist/types";
import shortid from "shortid";
import Node from "../";

export class Offers {
  @Inject(CacheService)
  public cache!: CacheService;

  public offers: { [id: string]: OfferServer } = {};

  constructor(
    public node: Node,
    public io: Server,
    public parser: ParsersList
  ) {}

  async offer(offer: OfferRequest, socketId: string) {
    const id = shortid.generate();

    this.offers[id] = {
      ...offer,
      id,
      requesterSocketId: socketId,
      ignoreds: [],
      accepted: false,
      routeSent: false,
      sendBuff: this.parser.offer.encode(offer),
      trys: 0,
    };

    await this.save(this.offers[id]);

    this.io.state.riders.offer(this.offers[id]);
  }

  save(offer: OfferServer) {
    return this.cache.set("rides:offer", offer.id, offer);
  }
}
