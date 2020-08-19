import { Server } from "socket.io";
import { distance as Distance } from "@gx-mob/geo-helper";
import { Driver } from "../schemas/common/driver";
import { Setup } from "../schemas/events/setup";
import { Configuration } from "../schemas/events/configuration";
import { Position } from "../schemas/events/position";
import { OfferServer } from "../schemas/events/offer";
import { OfferResponse } from "../schemas/events/offer-response";
import { ParsersList } from "extensor/dist/types";
import Node from "../";
import {
  OFFER_DRIVER_RESPONSE_TIMEOUT,
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
  constructor(
    public node: Node,
    public io: Server,
    public parser: ParsersList
  ) {
    io.nodes.on("setup", async ({ socketId, data }) => {
      this.setupDriver(socketId, data);
    });

    io.nodes.on("position", async ({ socketId, data }) => {
      this.setPosition(socketId, data);
    });

    io.nodes.on("offerResponse", ({ socketId, data }) => {
      if (data.id in io.state.offers.offers) {
        this.offerResponse(socketId, data);
      }
    });

    io.nodes.on("configuration", ({ socketId, data }) => {
      this.setConfiguration(socketId, data);
    });
  }

  /**
   * Setup driver initial information
   * @param {string} socketId
   * @param {string} pid
   */
  public async setupDriver(socketId: string, setup: Setup) {
    const connection = await this.node.getConnection(socketId);

    this.socketIdPidRef[socketId] = connection.pid;

    this.list[connection.pid] = {
      socketId,
      firstName: connection.firstName,
      lastName: connection.lastName,
      pid: connection.pid,
      rate: connection.rate,
      p2p: false,
      position: setup.position,
      config: setup.configuration,
      state: connection.state || 1,
    };
  }

  /**
   * Update driver position
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
  async offer(offer: OfferServer): Promise<void> {
    const driver = await this.match(offer);

    offer.trys++;

    /**
     * If don't have a match, inform to user the break time
     */
    if (!driver) {
      // TODO Try limit reached, require to user a break ~ 100
      return this.offer(offer);
    }

    /**
     * Set the current driver that receive the offer
     */
    offer.offeredTo = driver.pid;

    /**
     * Emit to driver the offer
     */
    this.emit(driver.socketId, "offer", offer);

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.emit(offer.requesterSocketId, "offerSent", driver);

    /**
     * Define a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(
      (rider, offer) => {
        offer.ignoreds.push(rider.pid);
        offer.offeredTo = null;
        this.offer(offer);
      },
      OFFER_DRIVER_RESPONSE_TIMEOUT,
      driver,
      offer
    );
  }

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
       * driver configuration update action, finished ride event
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
  offerResponse(socketId: string, data: OfferResponse) {
    const pid = this.socketIdPidRef[socketId];
    const driver = this.list[pid];
    const offer = this.io.state.offers.offers[data.id];

    /**
     * To avoid any bug in a delayed response and other driver already received the offer
     */
    if (offer.offeredTo !== pid) {
      return this.io.nodes.emit("delayedOfferReponse", socketId, true);
    }

    /**
     * Clear timeout response
     */
    clearTimeout(offer.offerResponseTimeout as NodeJS.Timeout);

    /**
     * If negative response, adds to ignore list and resume the offer
     */
    if (!data.response) {
      offer.ignoreds.push(pid);

      return this.offer(offer);
    }

    /**
     * Emits a success response to driver to pickup the voyager
     * Don't saves the ride, both side can cancel the ride yet,
     * only saves when the driver emit event ride start.
     */
    // Driver
    this.io.nodes.emit("driver_offerAccepted", socketId, true);
    // Voyager
    this.io.nodes.emit("voyager_offerAccepted", offer.requesterSocketId, {
      offerID: offer.id,
      driverPID: driver.pid,
    });
  }
}
