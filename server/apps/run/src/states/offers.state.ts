import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { DataService } from "@app/data";
import { SocketService } from "@app/socket";
import { logger } from "@app/helpers";
import { DriversState } from "./drivers.state";
import { OfferServer, OfferRequest } from "../events";
import { CACHE_NAMESPACES, CACHE_TTL, OFFER } from "../constants";

@Injectable()
export class OffersState {
  public list: OfferServer[] = [];
  constructor(
    readonly cacheService: CacheService,
    readonly dataService: DataService,
    readonly socketService: SocketService,
    @Inject(forwardRef(() => OffersState)) readonly driversState: DriversState,
  ) {}

  async createOffer(offer: OfferRequest, socketId: string): Promise<string> {
    const ride = await this.dataService.rides.get({ pid: offer.ridePID });

    if (!ride) {
      return OFFER.CREATE_RESPONSE_RIDE_NOT_FOUND;
    }

    const offerObject = {
      ride,
      requesterSocketId: socketId,
      ignoreds: [],
      offeredTo: null,
      offerResponseTimeout: null,
    };

    this.list.push(offerObject);

    await this.set(offer.ridePID, offerObject);

    this.driversState.offerRide(offerObject);

    return OFFER.CREATE_RESPONSE_OFFERING;
  }

  set(ridePID: string, data: any) {
    return this.cacheService.set(CACHE_NAMESPACES.OFFERS, ridePID, data, {
      ex: CACHE_TTL.OFFERS,
    });
  }

  get(ridePID: string) {
    return this.cacheService.get(CACHE_NAMESPACES.OFFERS, ridePID);
  }

  public findOffer(ridePID: string) {
    const offer = this.list.find((offer) => ridePID === offer.ride.pid);

    if (offer) {
      return offer;
    }

    logger.error(`Offer object for ridePID ${ridePID} not found`, {
      actor: "OffersState",
      nodeId: this.socketService.nodeId,
    });
  }
}
