import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { logger, util } from "@app/helpers";
import { DataService } from "@app/data";
import { SocketService } from "@app/socket";
import { geometry } from "@app/helpers";
import { ConnectionDataService } from "../conn-data.service";
import {
  EVENTS,
  // Common
  Driver,
  Connection,
  // Events
  Position,
  Setup,
  OfferResponse,
  OfferServer,
  OfferRequest,
  OfferSent,
  DriverRideAcceptedResponse,
  VoyagerRideAcceptedResponse,
  Configuration,
} from "../events";
import { OffersState } from "./offers.state";
import { OFFER, MATCH } from "../constants";

@Injectable()
export class DriversState {
  /**
   * Drivers position list
   */
  public list: Driver[] = [];

  constructor(
    readonly dataService: DataService,
    readonly socketService: SocketService,
    readonly connectionData: ConnectionDataService,
    @Inject(forwardRef(() => OffersState)) readonly offersState: OffersState,
  ) {
    this.socketService.on<Setup>(EVENTS.DRIVER_SETUP, ({ socketId, data }) => {
      this.setupDriverEvent(socketId, data);
    });

    this.socketService.on<Position>(EVENTS.POSITION, ({ socketId, data }) => {
      this.positionEvent(socketId, data);
    });

    this.socketService.on<Configuration>(
      EVENTS.CONFIGURATION,
      ({ socketId, data }) => {
        this.setConfigurationEvent(socketId, data);
      },
    );

    this.socketService.on<OfferResponse>(
      EVENTS.OFFER_RESPONSE,
      ({ socketId, data }) => {
        this.offerResponseEvent(socketId, data);
      },
    );
  }

  /**
   * Setup driver initial information
   * @param {string} socketId
   * @param {string} pid
   */
  public async setupDriverEvent(
    socketId: string,
    setup: Setup,
    connectionData?: Connection,
  ) {
    connectionData =
      connectionData || (await this.connectionData.get(socketId));

    if (!connectionData) {
      return this.log(
        "error",
        `Couldn't get connection data for socketId ${socketId}`,
      );
    }

    const driver = this.findDriver(socketId);
    const driverObject = {
      ...connectionData,
      socketId,
      position: setup.position,
      config: setup.configuration,
    };

    if (!driver) {
      return this.list.push(driverObject);
    }

    const driverIndex = this.list.indexOf(driver);

    this.list[driverIndex] = driverObject;
  }

  private log(type: "error" | "info" | "warn", msg: string) {
    logger[type](msg, {
      actor: "DriversState",
      nodeId: this.socketService.nodeId,
    });
  }

  findDriver(socketId: string): Driver | undefined {
    const driver = this.list.find((driver) => socketId === driver.socketId);

    if (driver) {
      return driver;
    }

    this.log(
      "info",
      `Local connection object for socketId ${socketId} not found`,
    );
  }

  /**
   * Update driver position
   * @param {string} socketId
   * @param {Position} position
   */
  positionEvent(socketId: string, position: Position) {
    const driver = this.findDriver(socketId);
    if (!driver) return;

    driver.position = position;
  }

  /**
   * Set driver search ride configuration
   * @param {string} socketId
   * @param {Configuration} config
   */
  setConfigurationEvent(socketId: string, config: Configuration) {
    const driver = this.findDriver(socketId);
    if (!driver) return;

    driver.config = config;
  }

  /**
   * Handle driver offer response
   */
  async offerResponseEvent(
    socketId: string,
    offerResponse: OfferResponse,
    driverData?: Connection,
  ) {
    const offer = this.offersState.findOffer(offerResponse.ridePID);
    if (!offer) return;

    const driver = driverData || (await this.connectionData.get(socketId));

    /**
     * To avoid any bug in a delayed response and other driver already received the offer
     */
    if (offer.offeredTo !== driver.pid) {
      return this.socketService.emit(socketId, "delayedOfferReponse", true);
    }

    /**
     * Clear timeout response
     */
    clearTimeout(offer.offerResponseTimeout as NodeJS.Timeout);

    /**
     * If negative response, adds to ignore list and resume the offer
     */
    if (!offerResponse.response) {
      offer.ignoreds.push(driver.pid);

      return this.offerRide(offer);
    }

    // Defines safe time cancel
    const acceptTimestamp = Date.now();

    // Store to decide in the future whether to generate a pendencie in a cancelation event
    await util.retry(
      () =>
        this.offersState.set(offerResponse.ridePID, {
          ...offer,
          driverSocketId: driver.socketId,
          acceptTimestamp,
        }),
      3,
      500,
    );

    // Update ride data
    await util.retry(
      () =>
        this.dataService.rides.update(
          { pid: offer.ride.pid },
          { driver: driver._id },
        ),
      3,
      500,
    );

    // Convert to seconds to be right serialized by schemapack uint32 type field
    const timestamp = Math.round(acceptTimestamp / 1000);

    // Emit to driver
    this.socketService.emit<DriverRideAcceptedResponse>(
      socketId,
      EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE,
      {
        ridePID: offer.ride.pid,
        timestamp,
      },
    );

    // Emit to voyager
    this.socketService.emit<VoyagerRideAcceptedResponse>(
      offer.requesterSocketId,
      EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE,
      {
        ridePID: offer.ride.pid,
        driverPID: driver.pid,
        timestamp,
      },
    );
  }

  /**
   * Offer a ride to drivers
   * @param {OfferServer} offer
   * @param {string} requesterSocketId SocketId of requester
   */
  async offerRide(offer: OfferServer): Promise<void> {
    const driver = await this.match(offer);

    /**
     * If don't have a match, inform to user the break time
     */
    if (!driver) {
      // TODO Try limit reached, require to user a pause ~ 100
      return this.offerRide(offer);
    }

    /**
     * Set the current driver that receive the offer
     */
    offer.offeredTo = driver.pid;

    /**
     * Emit the offer to driver
     */
    this.socketService.emit<OfferRequest>(driver.socketId, EVENTS.OFFER, {
      ridePID: offer.ride.pid,
    });

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.socketService.emit<OfferSent>(
      offer.requesterSocketId,
      EVENTS.OFFER_SENT,
      driver,
    );

    /**
     * Define a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(
      (rider, offer) => {
        offer.ignoreds.push(rider.pid);
        offer.offeredTo = null;
        this.offerRide(offer);
      },
      OFFER.DRIVER_RESPONSE_TIMEOUT,
      driver,
      offer,
    );
  }

  /**
   * Match driver algorithm
   *
   * @param {OfferServer} offer
   * @param {Driver[]} list Next iteration list
   */
  async match(
    offer: OfferServer,
    list: Driver[] = this.list,
    runTimes = 0,
  ): Promise<Driver | null> {
    ++runTimes;

    const nextList: Driver[] = [];
    const maxDistance = this.getDistance(runTimes);
    let currentDistance: number = Number.MAX_SAFE_INTEGER;
    let choiced: Driver | null = null;

    for (let i = 0; i < list.length; ++i) {
      const current = list[i];
      const { ride } = offer;

      const distance = geometry.distance.calculate(
        current.position.latLng,
        ride.route.start.coord,
      );
      /**
       * Hard skip conditions
       *
       * Conditions that probably not change or have effect in next execution.
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

      nextList.push(current);

      /**
       * Soft skip conditions
       *
       * Conditions that can be have effect change in next execution by the
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
        currentDistance = distance;
        continue;
      }

      /**
       * This driver is 20% more closer to the offer start point than last choiced driver
       */
      if (distance < currentDistance * 1.2) {
        choiced = current;
        currentDistance = distance;
      }

      /**
       * This driver have a avaliation rate 20% better than last choiced driver
       */
      if (current.rate < choiced.rate * 1.2) {
        choiced = current;
        currentDistance = distance;
      }
    }

    if (runTimes > MATCH.MAX_EXECUTION) {
      return null;
    }

    if (!choiced) {
      /**
       * Interval for next execution
       */
      await new Promise((resolve) =>
        setTimeout(resolve, MATCH.ITERATION_INTERVAL),
      );
      return await this.match(offer, nextList, runTimes);
    }

    return choiced;
  }

  // TODO Algorithm that defines this dynamically based on region(with a database configuration) and route distance
  /**
   * Gets the max distance to offer ride to drivers
   * @param trys
   */
  getDistance(trys: number): number {
    const distance =
      trys === 1
        ? OFFER.INITIAL_RADIUS_SIZE
        : OFFER.INITIAL_RADIUS_SIZE +
          OFFER.ADD_RADIUS_SIZE_EACH_ITERATION * trys;

    return distance > OFFER.MAX_RADIUS_SIZE ? OFFER.MAX_RADIUS_SIZE : distance;
  }
}
