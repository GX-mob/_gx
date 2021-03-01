import deepmerge from "deepmerge";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { util } from "@app/helpers";
import { CacheService, setOptions } from "@app/cache";
import { IRide } from "@shared/interfaces";
import { RideRepository, VehicleRepository } from "@app/repositories";
import { SocketService } from "@app/socket";
import { geometry } from "@app/helpers";
import {
  // Events interface,
  EventsInterface,
  EVENTS,
  // Enums
  DriverState,
  // Common
  Driver,
  ConnectionData,
  // Events
  Position,
  Setup,
  OfferResponse,
  OfferServer,
  OfferRequest,
  Configuration,
  UserState,
} from "@shared/events";
import { CACHE_NAMESPACES, CACHE_TTL, NAMESPACES } from "./constants";
import {
  NODES_EVENTS,
  INodesEvents,
  TellMeYourDriversState,
  UpdateDriverState,
  UpdateLocalSocketData,
} from "./events/nodes";
import { PinoLogger } from "nestjs-pino";
import {
  ConnectionDataNotFoundException,
  RideNotFoundException,
  VehicleNotFoundException,
} from "./exceptions";
import { Socket } from "socket.io";
import { retryUnderHood } from "@app/helpers/util";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class StateService {
  /**
   * Drivers list
   */
  public drivers = new Map<string, Driver>();
  /**
   * Offers list
   */
  public offers = new Map<string, OfferServer>();

  constructor(
    readonly cacheService: CacheService,
    readonly rideRepository: RideRepository,
    readonly socketService: SocketService<EventsInterface, INodesEvents>,
    private readonly logger: PinoLogger,
    readonly configService: ConfigService,
    private vehicleRepository: VehicleRepository,
  ) {
    logger.setContext(StateService.name);

    this.socketService.on(EVENTS.DRIVER_SETUP, ({ socketId, data }) => {
      this.setupDriverEvent(socketId, data).catch((err) => {
        this.logger.error(err);
      });
    });

    this.socketService.on(EVENTS.POSITION, ({ socketId, data }) => {
      this.positionEvent(socketId, data);
    });

    this.socketService.on(EVENTS.CONFIGURATION, ({ socketId, data }) => {
      this.setConfigurationEvent(socketId, data);
    });

    this.socketService.on(EVENTS.OFFER_RESPONSE, ({ socketId, data }) => {
      this.offerResponseEvent(socketId, data).catch((err) => {
        this.logger.error(err);
      });
    });

    /**
     * Internal nodes events
     */
    this.socketService.nodes.on(
      NODES_EVENTS.UPDATE_DRIVER_STATE,
      ({ socketId, state }, ack) => {
        ack(true);
        this.updateDriver(socketId, state, true);
      },
    );

    this.socketService.nodes.on(
      NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA,
      ({ socketId, namespace, data }, ack) => {
        ack(true);

        const client = this.socketService.server.of(namespace).sockets[
          socketId
        ];
        if (!client) return;

        client.data = { ...client.data, ...data };
      },
    );

    /**
     * Driver list cleanup
     */
    const driverObjectLifetime = this.configService.get(
      "DRIVERS_OBJECTS.OBJECT_LIFETIME",
    ) as number;
    const driversObjectListCleanUpInterval = this.configService.get(
      "DRIVERS_OBJECTS.LIST_CLEANUP_INTERVAL",
    ) as number;

    setInterval(() => {
      this.drivers.forEach((driver) => {
        const { updatedAt } = driver;
        const expireTimestamp = updatedAt + driverObjectLifetime;

        if (expireTimestamp < Date.now()) {
          this.drivers.delete(driver.pid);
        }
      });
    }, driversObjectListCleanUpInterval);

    this.socketService.nodes.on(
      NODES_EVENTS.TELL_ME_YOUR_DRIVERS_STATE,
      (_data, ack) => {
        ack({ drivers: Array.from(this.drivers.values()) });
      },
    );

    this.socketService.serviceEvents.on("serviceConfigured", () =>
      this.warmup(),
    );
  }

  /**
   * Warmup
   * Gets the state of others nodes and merge it to local list
   */
  private warmup() {
    this.socketService.nodes.emit(
      NODES_EVENTS.TELL_ME_YOUR_DRIVERS_STATE,
      { drivers: [] },
      (replies) => {
        const filtredReplies = replies.filter(
          (replie) => replie,
        ) as TellMeYourDriversState[];
        const responsesMerge = filtredReplies.reduce<Record<string, Driver>>(
          (currentValue, { drivers }) => {
            drivers.forEach((driver) => {
              currentValue[driver.pid] = driver;
            });

            return currentValue;
          },
          {},
        );

        this.drivers = new Map([
          ...this.drivers,
          ...Object.entries(responsesMerge),
        ]);

        console.log(this.drivers);
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
    connectionData?: ConnectionData,
  ) {
    if (!connectionData) {
      connectionData = await this.getConnectionData(socketId);
    }

    const vehicle = await this.vehicleRepository.find({ _id: setup.vehicleId });

    if (!vehicle) {
      throw new VehicleNotFoundException(setup.vehicleId);
    }

    const driverObject: Driver = {
      ...connectionData,
      socketId,
      position: setup.position,
      config: setup.config,
      vehicleType: vehicle.metadata.type,
      state: DriverState.SEARCHING,
      updatedAt: Date.now(),
    };

    this.drivers.set(connectionData.pid, driverObject);
  }

  findDriverBySocketId(
    socketId: string,
    logLevel: "error" | "info" | "warn" = "info",
  ): Driver | undefined {
    let driver;

    this.drivers.forEach((idriver) => {
      if (idriver.socketId === socketId) {
        driver = idriver;
      }
    });

    if (driver) {
      return driver;
    }

    this.logger[logLevel](
      `Local object for driver socketId ${socketId} not found`,
    );
  }

  /**
   * Update driver position
   * @param {string} socketId
   * @param {Position} position
   */
  positionEvent(socketId: string, position: Position) {
    const driver = this.findDriverBySocketId(socketId);
    if (!driver) return;

    driver.position = position;
    driver.updatedAt = Date.now();
  }

  /**
   * Set driver search ride configuration
   * @param {string} socketId
   * @param {Configuration} config
   */
  setConfigurationEvent(socketId: string, config: Configuration) {
    const driver = this.findDriverBySocketId(socketId);
    if (!driver) return;

    driver.config = config;
  }

  /**
   * Handle driver offer response
   */
  async offerResponseEvent(
    socketId: string,
    offerResponse: OfferResponse,
    driverData?: ConnectionData,
  ) {
    const offer = this.offers.get(offerResponse.ridePID);
    if (!offer) return;

    const driverConnectionData =
      driverData || (await this.getConnectionData(socketId));

    /**
     * To avoid any bug in a delayed response and other driver already received the offer
     */
    if (offer.offeredTo !== driverConnectionData.pid) {
      return this.socketService.emit(
        socketId,
        EVENTS.DELAYED_OFFER_RESPONSE,
        true,
      );
    }

    /**
     * Clear timeout response
     */
    clearTimeout(offer.offerResponseTimeout as NodeJS.Timeout);

    /**
     * If negative response, adds to ignore list and resume the offer
     */
    if (!offerResponse.response) {
      offer.ignoreds.push(driverConnectionData.pid);

      const ride = await this.rideRepository.find({ pid: offer.ridePID });

      this.offerRide(offer, ride as IRide);
      return;
    }

    this.updateDriver(socketId, { state: UserState.PICKING_UP });

    // Defines safe time cancel
    const acceptTimestamp = Date.now();

    // Store to decide in the future whether to generate a pendencie in a cancelation event
    const { offerResponseTimeout, ...offerStoreData } = offer;
    await util.retry(
      () =>
        this.cacheService.set(
          CACHE_NAMESPACES.OFFERS,
          offer.ridePID,
          {
            ...offerStoreData,
            driverSocketId: driverConnectionData.socketId,
            acceptTimestamp,
          },
          {
            ex: CACHE_TTL.OFFERS,
          },
        ),
      3,
      500,
    );

    // Update ride data
    await util.retry(
      () =>
        this.rideRepository.update(
          { pid: offer.ridePID },
          { driver: driverConnectionData._id },
        ),
      3,
      500,
    );

    // Convert to seconds to be right serialized by schemapack uint32 type field
    const timestamp = Math.round(acceptTimestamp / 1000);

    // Emit to driver
    this.socketService.emit(socketId, EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE, {
      ridePID: offer.ridePID,
      timestamp,
    });

    // Emit to voyager
    this.socketService.emit(
      offer.requesterSocketId,
      EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE,
      {
        ridePID: offer.ridePID,
        driverPID: driverConnectionData.pid,
        timestamp,
      },
    );

    const voyagerConnectionData = await this.getConnectionData(
      offer.requesterSocketId,
    );

    const driverUpdateConnectionData: Pick<ConnectionData, "observers"> = {
      observers: [
        ...driverConnectionData.observers,
        { socketId: offer.requesterSocketId, p2p: voyagerConnectionData.p2p },
      ],
    };
    const voyagerUpdateConnectionData: Pick<ConnectionData, "observers"> = {
      observers: [
        ...voyagerConnectionData.observers,
        {
          socketId: driverConnectionData.socketId,
          p2p: driverConnectionData.p2p,
        },
      ],
    };

    // Update driver observers
    retryUnderHood(() =>
      this.setConnectionData(
        driverConnectionData.pid,
        driverUpdateConnectionData,
      ),
    );

    // Update voyager observers
    retryUnderHood(() =>
      this.setConnectionData(
        voyagerConnectionData.pid,
        voyagerUpdateConnectionData,
      ),
    );

    this.socketService.nodes.emit(NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA, {
      socketId: voyagerConnectionData.socketId,
      namespace: NAMESPACES.VOYAGERS,
      data: voyagerUpdateConnectionData,
    });

    this.socketService.nodes.emit(NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA, {
      socketId: driverConnectionData.socketId,
      namespace: NAMESPACES.DRIVERS,
      data: driverUpdateConnectionData,
    });
  }

  async createOffer(
    offer: OfferRequest,
    client: Socket,
    startOffer = true,
  ): Promise<boolean> {
    const ride = await this.rideRepository.find({ pid: offer.ridePID });

    if (!ride) {
      throw new RideNotFoundException();
    }

    const offerObject: OfferServer = {
      ridePID: offer.ridePID,
      requesterSocketId: client.id,
      ignoreds: [],
      offeredTo: null,
      offerResponseTimeout: null,
    };

    client.data.rides.push(ride.pid);

    this.offers.set(offer.ridePID, offerObject);

    await this.cacheService.set(
      CACHE_NAMESPACES.OFFERS,
      ride.pid,
      offerObject,
      {
        ex: CACHE_TTL.OFFERS,
      },
    );

    startOffer && this.offerRide(offerObject, ride);

    // acknownlegment
    return true;
  }

  /**
   * Offer a ride to drivers
   * @param {OfferServer} offer
   * @param {string} requesterSocketId SocketId of requester
   */
  async offerRide(offer: OfferServer, ride: IRide): Promise<void> {
    const driver = await this.match(offer, ride);

    /**
     * If don't have a match, informes to user the break time,
     * this should be rarely executed, its to avoid a long time
     * blocking of server resources.
     */
    if (!driver) {
      this.socketService.emit(
        offer.requesterSocketId,
        EVENTS.OFFER_GOT_TOO_LONG,
        true,
      );
      return;
    }

    /**
     * Defines the current driver that received the offer
     */
    offer.offeredTo = driver.pid;

    /**
     * Emit the offer to driver
     */
    this.socketService.emit(driver.socketId, EVENTS.OFFER, {
      ridePID: offer.ridePID,
    });

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.socketService.emit(offer.requesterSocketId, EVENTS.OFFER_SENT, driver);

    /**
     * Defines a timeout to driver response
     */
    offer.offerResponseTimeout = setTimeout(
      (rider, offer) => {
        offer.ignoreds.push(rider.pid);
        offer.offeredTo = null;
        this.offerRide(offer, ride);
      },
      this.configService.get("OFFER.DRIVER_RESPONSE_TIMEOUT") as number,
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
    ride: IRide,
    list: Map<string, Driver> = this.drivers,
    runTimes = 0,
  ): Promise<Driver | null> {
    ++runTimes;

    const nextList = new Map<string, Driver>();
    const maxDistance = this.getDistance(runTimes);
    let currentDistance: number = Number.MAX_SAFE_INTEGER;
    let choiced: Driver | null = null;

    list.forEach((current) => {
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
        distance > this.configService.get("MATCH.TOO_AWAY")
      ) {
        return;
      }

      nextList.set(current.pid, current);

      /**
       * Soft skip conditions
       *
       * Conditions that can be have effect change in next iteration by the
       * driver configuration update action, entered in ride-finalization-state,
       * or got enter in max distance area.
       */
      if (
        /**
         * Not searching ride
         */
        current.state !== DriverState.SEARCHING ||
        /**
         * Not match with the driver configured district
         */
        (current.config.drops[0] !== "any" &&
          !(current.config.drops as string[]).includes(
            ride.route.end.district,
          )) ||
        /**
         * Not match with the driver configured pay method
         */
        !current.config.payMethods.includes(ride.payMethod) ||
        /**
         * The driver not accept or cannot serve the ride type
         */
        !current.config.types.includes(ride.type) ||
        /**
         * Not eligible, for now, but can be in future
         */
        distance > maxDistance
      ) {
        return;
      }

      /**
       * No choiced drivers, first eligible
       */
      if (!choiced) {
        choiced = current;
        currentDistance = distance;
      }

      /**
       * This driver is 20% more closer than last choiced one
       */
      if (distance < currentDistance * 0.8) {
        choiced = current;
        currentDistance = distance;
      }

      /**
       * This driver have a avaliation rate 20% better than last choiced driver
       */
      if (current.rate > choiced.rate * 0.8) {
        choiced = current;
        currentDistance = distance;
      }
    });

    if (runTimes > this.configService.get("MATCH.MAX_ITERATION")) {
      return null;
    }

    if (!choiced) {
      /**
       * Interval for next execution
       */
      const iterationInterval = this.configService.get(
        "MATCH.ITERATION_INTERVAL",
      );

      await new Promise((resolve) => setTimeout(resolve, iterationInterval));
      return this.match(offer, ride, nextList, runTimes);
    }

    return choiced;
  }

  // TODO Algorithm that defines this dynamically based on region(with a database configuration) and route distance
  /**
   * Gets the max distance to offer ride to drivers
   * @param trys
   */
  getDistance(trys: number): number {
    const initialRadiusSize = this.configService.get(
      "OFFER.INITIAL_RADIUS_SIZE",
    );
    const addRadiusSizeEachIteration = this.configService.get(
      "OFFER.ADD_RADIUS_SIZE_EACH_ITERATION",
    );
    const maxRadiusSize = this.configService.get("OFFER.MAX_RADIUS_SIZE");

    const distance =
      trys === 1
        ? initialRadiusSize
        : initialRadiusSize + addRadiusSizeEachIteration * trys;

    return distance > maxRadiusSize ? maxRadiusSize : distance;
  }

  setOfferData(
    ridePID: string,
    data: Partial<Omit<OfferServer, "offerResponseTimeout">>,
  ): Promise<Omit<OfferServer, "offerResponseTimeout">> {
    return this.setOrUpdateCache(CACHE_NAMESPACES.OFFERS, ridePID, data, {
      ex: CACHE_TTL.OFFERS,
    });
  }

  getOfferData(
    ridePID: string,
  ): Promise<Omit<OfferServer, "offerResponseTimeout">> {
    return this.cacheService.get(CACHE_NAMESPACES.OFFERS, ridePID);
  }

  /**
   * Get connection data
   * @param id Socket ID or User public ID
   */
  public async getConnectionData(id: string): Promise<ConnectionData> {
    const connection = await this.cacheService.get(
      CACHE_NAMESPACES.CONNECTIONS,
      id,
    );

    if (!connection) {
      throw new ConnectionDataNotFoundException(id);
    }

    return connection;
  }

  /**
   * Set connection data
   * @param pid User public ID
   * @param data
   */
  public async setConnectionData(
    pid: string,
    data: Partial<ConnectionData>,
  ): Promise<ConnectionData> {
    return this.setOrUpdateCache(CACHE_NAMESPACES.CONNECTIONS, pid, data, {
      link: [data.socketId as string],
      ex: CACHE_TTL.CONNECTIONS,
    });
  }

  private async setOrUpdateCache<T = any>(
    namespace: string,
    key: string,
    data: any,
    options: setOptions,
  ): Promise<T> {
    const previousData = await this.cacheService.get(namespace, key);

    const newData = { ...previousData, ...data };

    await this.cacheService.set(namespace, key, newData, options);

    return newData;
  }

  /**
   * Updates the driver object in local state list
   * and emits an event to others server nodes
   */
  updateDriver(
    socketId: string,
    state: Partial<Driver>,
    // To prevent recursive propagation of the event
    isNodeEvent = false,
  ) {
    const driver = this.findDriverBySocketId(socketId, "warn");
    if (!driver) return;

    this.drivers.set(driver.pid, {
      ...driver,
      ...state,
      updatedAt: Date.now(),
    });

    if (!isNodeEvent) {
      this.socketService.nodes.emit(NODES_EVENTS.UPDATE_DRIVER_STATE, {
        socketId,
        state,
      });
    }
  }
}
