import { Inject } from "fastify-decorators";
import { Server } from "socket.io";
import { DataService, util } from "@gx-mob/http-service";
import { distance as Distance } from "@gx-mob/geo-helper";
import { Driver } from "../schemas/common/driver";
import { Setup } from "../schemas/events/setup";
import { Configuration } from "../schemas/events/configuration";
import { Position } from "../schemas/events/position";
import { OfferServer } from "../schemas/events/offer";
import { OfferResponse } from "../schemas/events/offer-response";
import { ParsersList } from "extensor/dist/types";
import Node from "../node";
import {
  OFFER_DRIVER_RESPONSE_TIMEOUT,
  OFFER_ADDITIONAL_METERS_OVER_TRY,
  OFFER_INITIAL_DISTANCE_LIMIT,
  OFFER_DISTANCE_LIMIT,
  MATCH_MAX_EXECUTION,
  MATCH_EXECUTION_INTERVAL,
} from "../constants";
import { Connection } from "src/schemas/common/connection";

type DriversList = {
  [id: string]: Driver;
};

type BroadcastedEvent<Data> = { socketId: string; data: Data };

export class Riders {
  @Inject(DataService)
  public data!: DataService;

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
    io.nodes.on(
      "setup",
      async ({ socketId, data }: BroadcastedEvent<Setup>) => {
        this.setupDriver(socketId, data);
      }
    );

    io.nodes.on(
      "position",
      async ({ socketId, data }: BroadcastedEvent<Position>) => {
        this.setPosition(socketId, data);
      }
    );

    io.nodes.on(
      "offerResponse",
      ({ socketId, data }: BroadcastedEvent<OfferResponse>) => {
        if (data.id in io.state.offers.offers) {
          this.offerResponse(socketId, data);
        }
      }
    );

    io.nodes.on(
      "configuration",
      ({ socketId, data }: BroadcastedEvent<Configuration>) => {
        this.setConfiguration(socketId, data);
      }
    );
  }

  /**
   * Setup driver initial information
   * @param {string} socketId
   * @param {string} pid
   */
  public async setupDriver(
    socketId: string,
    setup: Setup,
    connection?: Connection
  ) {
    connection = connection || (await this.node.getConnection(socketId));

    this.socketIdPidRef[socketId] = connection.pid;

    this.list[connection.pid] = {
      ...connection,
      position: setup.position,
      config: setup.configuration,
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
     * Emit the offer to driver
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
    const maxDistance = this.getDistance(runTimes);
    const keys = Object.keys(list);
    let currentDistnace: number = Number.MAX_SAFE_INTEGER;
    let choiced: Driver | null = null;

    for (let i = 0; i < keys.length; ++i) {
      const current = list[keys[i]];
      const { ride } = offer;

      const distance = Distance.calculate(
        current.position.latLng,
        ride.route.start.coord
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
        offer.ignoreds.includes(current.pid) ||
        /**
         * Removes drivers that are too away
         */
        distance > 3000
      ) {
        continue;
      }

      nextList[current.pid] = current;

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
        current.state !== 2 ||
        /**
         * Not match with the driver configured district
         */
        (current.config.drops[0] !== "any" &&
          current.config.drops.includes(ride.route.end.district)) ||
        /**
         * Not match with the driver configured pay method
         */
        current.config.payMethods.includes(ride.payMethod) ||
        /**
         * The driver not accept the ride type
         * * For future feature, for give the choice to driver not receive offers of group rides
         */
        current.config.types.includes(ride.type) ||
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
        choiced = current;
        currentDistnace = distance;
        continue;
      }

      /**
       * This driver is 20% more closer to the offer start point than last choiced driver
       */
      if (distance < currentDistnace * 1.2) {
        choiced = current;
        currentDistnace = distance;
      }

      /**
       * This driver have a avaliation rate 20% better than last choiced driver
       */
      if (current.rate < choiced.rate * 1.2) {
        choiced = current;
        currentDistnace = distance;
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

  // TODO Algorithm that defines this dynamically based on region(with a database configuration service provider) and route distance
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
  async offerResponse(socketId: string, data: OfferResponse) {
    // TODO
    // await util.rerunOverFail(
    //   this.data.rides.update(
    //     { pid: offer.ride.pid },
    //     { driver: driver._id }
    //   )
    // , 3);

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

    // Convert to seconds to be right serialized by schemapack uint32 type field
    const driverAcceptedTimestamp = Math.round(Date.now() / 1000);

    // Store to decide in the future whether to generate a pendencie in a cancelation event
    await util.retry(
      () =>
        this.io.state.offers.save(data.id, {
          rideAcceptedTimestamp: driverAcceptedTimestamp,
        }),
      3,
      500
    );

    // Update ride data
    await util.retry(
      () =>
        this.data.rides.update({ pid: offer.ride.pid }, { driver: driver._id }),
      3,
      500
    );

    // Emit to driver
    this.io.nodes.emit("driver_offerAccepted", socketId, {
      rideAcceptedTimestamp: driverAcceptedTimestamp,
    });

    // Emit to voyager
    this.io.nodes.emit("voyager_offerAccepted", offer.requesterSocketId, {
      ridePID: offer.ride.pid,
      driverPID: driver.pid,
      rideAcceptedTimestamp: driverAcceptedTimestamp,
    });
  }
}
