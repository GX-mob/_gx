import { Server } from "socket.io";
import { Driver, Configuration } from "../schemas/common/driver";
import { Position } from "../schemas/events/position";
import { OfferServer } from "../schemas/events/offer";
import { OfferResponse } from "../schemas/events/offer-response";
import { ParsersList } from "extensor/dist/types";
import {
  OFFER_DRIVER_OFFER_RESPONSE_TIMEOUT,
  OFFER_ADDITIONAL_METERS_OVER_TRY,
  OFFER_INITIAL_MAX_DISTANCE,
} from "../constants";
import { UserBasic } from "src/schemas/common/user-basic";

type DriversList = { [id: string]: Driver };

export class Riders {
  public searchingList: DriversList = {};
  public runningList: DriversList = {};
  public list: DriversList = {};
  /**
   * SocketId to PID reference list
   */
  public socketIdPidRef: { [SocketId: string]: string } = {};

  /**
   * Set listeners of another server nodes
   */
  constructor(public io: Server, public parser: ParsersList) {
    io.nodes.on("offerResponse", ({ socketId, data }) => {
      if (socketId in io.sockets) {
        this.offerResponse(socketId, data);
      }
    });

    io.nodes.on("configuration", ({ socketId, data }) => {
      if (socketId in io.sockets) {
        this.setConfiguration(socketId, data);
      }
    });
  }

  /**
   * Set SocketId PID reference
   * @param socketId
   * @param pid
   */
  public setSocketIdPidRef(socketId: string, user: UserBasic) {
    this.socketIdPidRef[socketId] = user.pid;
  }

  /**
   * Set driver position
   * @param socketId
   * @param {Position} position
   */
  setPosition(socketId: string, position: Position) {
    const pid = this.socketIdPidRef[socketId];
    this.list[pid].position = position;
  }

  /**
   * Set driver search ride configuration
   * @param {string} pid
   * @param {Configuration} config
   */
  setConfiguration(pid: string, config: Configuration) {
    this.list[pid].config = config;
  }

  /**
   * Offer a ride to drivers
   * @param {OfferServer} offer
   * @param {string} socketId SocketId of requester
   */
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
     * Emit to driver the offer
     */
    this.emit(rider.socketId, "offer", offer);

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.emit(socketId, "offerSent", rider);

    /**
     * Define a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(() => {
      offer.ignoreds.push(rider.pid);
      this.offer(offer, socketId);
    }, OFFER_DRIVER_OFFER_RESPONSE_TIMEOUT);
  }

  // TODO algorithm description
  /**
   * Match driver algorithm
   * @param offer
   * @param {string} socketId SocketId of requester
   * @param list Next iteration list
   */
  async match(
    offer: OfferServer,
    socketId: string,
    list: DriversList = this.list
  ): Promise<(Driver & { socketId: string }) | null> {
    const nextList: DriversList = {};

    const maxDistance = this.getDistance(offer.trys);

    const keys = Object.keys(list);

    for (let i = 0; i < keys.length; ++i) {
      const driver = list[keys[i]];

      /**
       * Skip if:
       *
       * * Ignored driver
       * * Not searching ride
       * * No match ride options
       */
      if (offer.ignoreds.includes(driver.pid) || driver.state !== 1) {
        continue;
      }
    }
    return null;
  }

  getDistance(trys: number): number {
    return trys === 1
      ? OFFER_INITIAL_MAX_DISTANCE
      : OFFER_INITIAL_MAX_DISTANCE + OFFER_ADDITIONAL_METERS_OVER_TRY * trys;
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
