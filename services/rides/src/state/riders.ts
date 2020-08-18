import { Server } from "socket.io";
import { distance as Distance } from "@gx-mob/geo-helper";
import { Driver, Configuration } from "../schemas/common/driver";
import { Position } from "../schemas/events/position";
import { OfferServer } from "../schemas/events/offer";
import { OfferResponse } from "../schemas/events/offer-response";
import { ParsersList } from "extensor/dist/types";
import {
  OFFER_DRIVER_OFFER_RESPONSE_TIMEOUT,
  OFFER_ADDITIONAL_METERS_OVER_TRY,
  OFFER_INITIAL_DISTANCE_LIMIT,
  OFFER_DISTANCE_LIMIT,
  MATCH_MAX_EXECUTION,
  MATCH_EXECUTION_INTERVAL,
} from "../constants";

type DriversList = {
  [id: string]: Driver;
};

export class Riders {
  /**
   * Drivers position list
   */
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
   * @param {string} socketId
   * @param {string} pid
   */
  public setSocketIdPidRef(socketId: string, pid: string) {
    this.socketIdPidRef[socketId] = pid;
  }

  /**
   * Set driver position
   * @param {string} socketId
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
  setConfiguration(socketId: string, config: Configuration) {
    const pid = this.socketIdPidRef[socketId];
    this.list[pid].config = config;
  }

  /**
   * Offer a ride to drivers
   * @param {OfferServer} offer
   * @param {string} socketId SocketId of requester
   */
  async offer(offer: OfferServer, socketId: string): Promise<void> {
    const result = await this.match(offer, socketId);

    offer.trys++;

    /**
     * If don't have a match, rerun match algorithm
     */
    if (!result) {
      // TODO Try limit reached, requests a break ~ 100
      return this.offer(offer, socketId);
    }

    const { rider, socketId: riderSocketId } = result;

    /**
     * Emit to driver the offer
     */
    this.emit(riderSocketId, "offer", offer);

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
    list: DriversList = this.list,
    runTimes = 0
  ): Promise<{ rider: Driver; socketId: string } | null> {
    ++runTimes;

    const nextList: DriversList = {};
    const maxDistance = this.getDistance(offer.trys);
    const keys = Object.keys(list);
    let lastDistance: number = Number.MAX_SAFE_INTEGER;
    let choiced: Driver | null = null;

    for (let i = 0; i < keys.length; ++i) {
      const driver = list[keys[i]];
      const { pid, state, config, rate } = driver;

      const distance = Distance.calculate(
        driver.position.latLng,
        offer.start.latLng
      );

      /**
       * Skip conditions
       */
      if (
        /**
         * Is ignored driver
         */
        offer.ignoreds.includes(pid) ||
        /**
         * Not searching ride
         */
        driver.state !== 2 ||
        /**
         * Not match with the driver configured district
         */
        (driver.config.drops[0] !== "any" &&
          driver.config.drops.includes(offer.end.district)) ||
        /**
         * Not match with the driver configured pay method
         */
        driver.config.payMethods.includes(offer.payMethod) ||
        /**
         * The driver not accept the ride type
         * * For future feature, for give the choice to driver not receive offers of group rides
         */
        driver.config.types.includes(offer.type) ||
        /**
         * To improve performance in case of a next iteration,
         * removes drivers that are too away
         */
        distance > 3000
      ) {
        continue;
      }

      nextList[pid] = driver;

      /**
       * Not eligible, for now, but can be in future
       */
      if (distance > maxDistance) {
        continue;
      }

      /**
       * No choiced drivers, first eligible
       */
      if (!choiced) {
        choiced = driver;
        lastDistance = distance;
        continue;
      }

      /**
       * This driver is 20% more closer of the offer start point than last choiced driver
       */
      if (distance < lastDistance * 1.2) {
        choiced = driver;
        lastDistance = distance;
      }

      /**
       * This driver have a avaliation rate 20% better than last choiced driver
       */
      if (rate < choiced.rate * 1.2) {
        choiced = driver;
        lastDistance = distance;
      }
    }

    if (runTimes > MATCH_MAX_EXECUTION) {
      return null;
    }

    if (!choiced) {
      /**
       * Interval for next execution
       */
      await new Promise((resolve) =>
        setTimeout(resolve, MATCH_EXECUTION_INTERVAL)
      );
      return await this.match(offer, socketId, nextList, runTimes);
    }

    return { rider: choiced, socketId };
  }

  // TODO Algorithm that defines this dynamically based on region(with a database configuration services provider) and route distance
  /**
   * Gets the max distance to offer ride to drivers
   * @param trys
   */
  getDistance(trys: number): number {
    const distance =
      trys === 1
        ? OFFER_INITIAL_DISTANCE_LIMIT
        : OFFER_INITIAL_DISTANCE_LIMIT +
          OFFER_ADDITIONAL_METERS_OVER_TRY * trys;

    return distance > OFFER_DISTANCE_LIMIT ? OFFER_DISTANCE_LIMIT : distance;
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
