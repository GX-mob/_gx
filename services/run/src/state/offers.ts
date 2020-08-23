import { Server } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService, CacheService } from "@gx-mob/http-service";
import { OfferRequest, OfferServer } from "../schemas/events/offer";
import { ParsersList } from "extensor/dist/types";
import Node from "../node";

export class Offers {
  @Inject(DataService)
  public data!: DataService;

  @Inject(CacheService)
  public cache!: CacheService;

  public offers: { [id: string]: OfferServer } = {};

  constructor(
    public node: Node,
    public io: Server,
    public parser: ParsersList
  ) {}

  async offer(offer: OfferRequest, socketId: string): Promise<string> {
    const ride = await this.data.rides.get({ pid: offer.rideID });

    if (!ride) {
      return "ride-not-found";
    }

    this.offers[offer.rideID] = {
      ride,
      requesterSocketId: socketId,
      ignoreds: [],
      //sendBuff: this.parser.offer.encode(offer),
      offeredTo: null,
      offerResponseTimeout: null,
    };

    await this.save(offer.rideID, this.offers[offer.rideID]);

    this.io.state.riders.offer(this.offers[offer.rideID]);

    return "offering";
  }

  save(id: string, data: any) {
    return this.cache.set("rides:offers", id, data);
  }

  get(id: string) {
    return this.cache.get("rides:offers", id);
  }
}
