import { Server } from "socket.io";
import { distance as Distance } from "@gx-mob/geo-helper";
import { UserBasic } from "../schemas/common/user-basic";
import { Driver } from "../schemas/common/driver";
import { Configuration } from "../schemas/events/configuration";
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
import { User } from "@gx-mob/http-service/dist/models";

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

  public setupDriver(driver: Driver) {
    this.socketIdPidRef[driver.socketId] = driver.pid;
    this.list[driver.pid] = driver;
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
   * @param {string} requesterSocketId SocketId of requester
   */
  async offer(offer: OfferServer, requesterSocketId: string): Promise<void> {
    const rider = await this.match(offer);

    offer.trys++;

    /**
     * If don't have a match, infor to user the break time
     */
    if (!rider) {
      // TODO Try limit reached, requests a break ~ 100
      return this.offer(offer, requesterSocketId);
    }

    /**
     * Emit to driver the offer
     */
    this.emit(rider.socketId, "offer", offer);

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.emit(requesterSocketId, "offerSent", rider);

    /**
     * Define a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(() => {
      offer.ignoreds.push(rider.pid);
      this.offer(offer, requesterSocketId);
    }, OFFER_DRIVER_OFFER_RESPONSE_TIMEOUT);
  }

  // TODO algorithm description
  /**
   * Match driver algorithm
   *
   * @param offer
   * @param {string} socketId SocketId of requester
   * @param list Next iteration list
   */
  async match(
    offer: OfferServer,
    list: DriversList = this.list,
    runTimes = 0
  ): Promise<Driver | null> {
    ++runTimes;

    const nextList: DriversList = {};
    const maxDistance = this.getDistance(offer.trys);
    const keys = Object.keys(list);
    let lastDistance: number = Number.MAX_SAFE_INTEGER;
    let choiced: Driver | null = null;

    for (let i = 0; i < keys.length; ++i) {
      const driver = list[keys[i]];
      const { pid, rate } = driver;

      const distance = Distance.calculate(
        driver.position.latLng,
        offer.start.latLng
      );
      /**
       * Hard skip conditions
       *
       * Conditions that probably not change in next execution.
       */
      if (
        /**
         * Is ignored driver
         */
        offer.ignoreds.includes(pid) ||
        /**
         * Removes drivers that are too away
         */
        distance > 3000
      ) {
        continue;
      }

      nextList[pid] = driver;

      /**
       * Soft skip conditions
       *
       * Conditions that can be changed in next execution by the
       * driver configurationupdate action, finished ride event
       * or got enter in max distance area.
       */
      if (
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
         * Not eligible, for now, but can be in future
         */
        distance > maxDistance
      ) {
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
       * This driver is 20% more closer to the offer start point than last choiced driver
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
      return await this.match(offer, nextList, runTimes);
    }

    return choiced;
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
