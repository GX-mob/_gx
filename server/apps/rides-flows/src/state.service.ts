import deepmerge from "deepmerge";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { util } from "@app/helpers";
import { CacheService, setOptions } from "@app/cache";
import { IRide } from "@core/domain/ride";
import { RideRepository, VehicleRepository } from "@app/repositories";
import { SocketService } from "@app/socket";
import { geometry } from "@app/helpers";
import {
  // Events interface,
  IRideFlowEvents,
  ERideFlowEvents,
  // Enums
  EUserState,
  // Common
  IDriverData,
  IConnectionData,
  // Events
  IPositionData,
  ISetup,
  IOfferResponse,
  IOfferServer,
  IOfferRequest,
  IConfiguration,
} from "@core/interfaces/events";
import { CacheNamespaces, CacheTTL, GatewayNamespaces } from "./constants";
import {
  EServerNodesEvents,
  INodesEvents,
  TellMeYourDriversState,
  IUpdateDriverState,
  IUpdateLocalSocketData,
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
  public drivers = new Map<string, IDriverData>();
  /**
   * Offers list
   */
  public offers = new Map<string, IOfferServer>();

  constructor(
    readonly cacheService: CacheService,
    readonly rideRepository: RideRepository,
    readonly socketService: SocketService<IRideFlowEvents, INodesEvents>,
    private readonly logger: PinoLogger,
    readonly configService: ConfigService,
    private vehicleRepository: VehicleRepository,
  ) {
    logger.setContext(StateService.name);

    this.socketService.on(ERideFlowEvents.DriverSetup, ({ socketId, data }) => {
      this.setupDriverEvent(socketId, data).catch((err) => {
        this.logger.error(err);
      });
    });

    this.socketService.on(ERideFlowEvents.Position, ({ socketId, data }) => {
      this.positionEvent(socketId, data);
    });

    this.socketService.on(ERideFlowEvents.Configuration, ({ socketId, data }) => {
      this.setConfigurationEvent(socketId, data);
    });

    this.socketService.on(ERideFlowEvents.OfferResponse, ({ socketId, data }) => {
      this.offerResponseEvent(socketId, data).catch((err) => {
        this.logger.error(err);
      });
    });

    /**
     * Internal nodes events
     */
    this.socketService.nodes.on(
      EServerNodesEvents.UpdateDriverState,
      ({ socketId, state }, ack) => {
        ack(true);
        this.updateDriver(socketId, state, true);
      },
    );

    this.socketService.nodes.on(
      EServerNodesEvents.UpdateLocalAccountData,
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
      EServerNodesEvents.TellMeYourDriversState,
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
      EServerNodesEvents.TellMeYourDriversState,
      { drivers: [] },
      (replies) => {
        const filtredReplies = replies.filter(
          (replie) => replie,
        ) as TellMeYourDriversState[];
        const responsesMerge = filtredReplies.reduce<Record<string, IDriverData>>(
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
    setup: ISetup,
    connectionData?: IConnectionData,
  ) {
    if (!connectionData) {
      connectionData = await this.getConnectionData(socketId);
    }

    const vehicle = await this.vehicleRepository.find({ _id: setup.vehicleId });

    if (!vehicle) {
      throw new VehicleNotFoundException(setup.vehicleId);
    }

    const driverObject: IDriverData = {
      ...connectionData,
      socketId,
      position: setup.position,
      config: setup.config,
      vehicleType: vehicle.metadata.type,
      state: EUserState.SEARCHING,
      updatedAt: Date.now(),
    };

    this.drivers.set(connectionData.pid, driverObject);
  }

  findDriverBySocketId(
    socketId: string,
    logLevel: "error" | "info" | "warn" = "info",
  ): IDriverData | undefined {
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
   * @param {IPositionData} position
   */
  positionEvent(socketId: string, position: IPositionData) {
    const driver = this.findDriverBySocketId(socketId);
    if (!driver) return;

    driver.position = position;
    driver.updatedAt = Date.now();
  }

  /**
   * Set driver search ride configuration
   * @param {string} socketId
   * @param {IConfiguration} config
   */
  setConfigurationEvent(socketId: string, config: IConfiguration) {
    const driver = this.findDriverBySocketId(socketId);
    if (!driver) return;

    driver.config = config;
  }

  /**
   * Handle driver offer response
   */
  async offerResponseEvent(
    socketId: string,
    offerResponse: IOfferResponse,
    driverData?: IConnectionData,
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
        ERideFlowEvents.DelayedOfferResponse,
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
    if (!offerResponse.accepted) {
      offer.ignoreds.push(driverConnectionData.pid);

      const ride = await this.rideRepository.find({ pid: offer.ridePID });

      this.offerRide(offer, ride as IRide);
      return;
    }

    this.updateDriver(socketId, { state: EUserState.GET_OVER_HERE });

    // Defines safe time cancel
    const acceptTimestamp = Date.now();

    // Store to decide in the future whether to generate a pendencie in a cancelation event
    const { offerResponseTimeout, ...offerStoreData } = offer;
    await util.retry(
      () =>
        this.cacheService.set(
          CacheNamespaces.OFFERS,
          offer.ridePID,
          {
            ...offerStoreData,
            driverSocketId: driverConnectionData.socketId,
            acceptTimestamp,
          },
          {
            ex: CacheTTL.OFFERS,
          },
        ),
      3,
      500,
    );

    // Update ride data
    await util.retry(
      () =>
        this.rideRepository.updateByQuery(
          { pid: offer.ridePID },
          { driver: driverConnectionData._id },
        ),
      3,
      500,
    );

    // Convert to seconds to be right serialized by schemapack uint32 type field
    const timestamp = Math.round(acceptTimestamp / 1000);

    // Emit to driver
    this.socketService.emit(socketId, ERideFlowEvents.DriverRideAcceptedResponse, {
      ridePID: offer.ridePID,
      timestamp,
    });

    // Emit to voyager
    this.socketService.emit(
      offer.requesterSocketId,
      ERideFlowEvents.VoyagerRideAcceptedResponse,
      {
        ridePID: offer.ridePID,
        driverPID: driverConnectionData.pid,
        timestamp,
      },
    );

    const voyagerConnectionData = await this.getConnectionData(
      offer.requesterSocketId,
    );

    const driverUpdateConnectionData: Pick<IConnectionData, "observers"> = {
      observers: [
        ...driverConnectionData.observers,
        { pid: "offer", p2p: voyagerConnectionData.p2p },
      ],
    };
    const voyagerUpdateConnectionData: Pick<IConnectionData, "observers"> = {
      observers: [
        ...voyagerConnectionData.observers,
        {
          pid: driverConnectionData.socketId,
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

    this.socketService.nodes.emit(EServerNodesEvents.UpdateLocalAccountData, {
      socketId: voyagerConnectionData.socketId,
      namespace: GatewayNamespaces.Voyagers,
      data: voyagerUpdateConnectionData,
    });

    this.socketService.nodes.emit(EServerNodesEvents.UpdateLocalAccountData, {
      socketId: driverConnectionData.socketId,
      namespace: GatewayNamespaces.Drivers,
      data: driverUpdateConnectionData,
    });
  }

  async createOffer(
    offer: IOfferRequest,
    client: Socket,
    startOffer = true,
  ): Promise<boolean> {
    const ride = await this.rideRepository.find({ pid: offer.ridePID });

    if (!ride) {
      throw new RideNotFoundException();
    }

    const offerObject: IOfferServer = {
      ridePID: offer.ridePID,
      requesterSocketId: client.id,
      ignoreds: [],
      offeredTo: null,
      offerResponseTimeout: null,
    };

    client.data.rides.push(ride.pid);

    this.offers.set(offer.ridePID, offerObject);

    await this.cacheService.set(
      CacheNamespaces.OFFERS,
      ride.pid,
      offerObject,
      {
        ex: CacheTTL.OFFERS,
      },
    );

    startOffer && this.offerRide(offerObject, ride);

    // acknownlegment
    return true;
  }

  /**
   * Offer a ride to drivers
   * @param {IOfferServer} offer
   * @param {string} requesterSocketId SocketId of requester
   */
  async offerRide(offer: IOfferServer, ride: IRide): Promise<void> {
    const driver = await this.match(offer, ride);

    /**
     * If don't have a match, informes to user the break time,
     * this should be rarely executed, its to avoid a long time
     * blocking of server resources.
     */
    if (!driver) {
      this.socketService.emit(
        offer.requesterSocketId,
        ERideFlowEvents.OfferGotTooLong,
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
    this.socketService.emit(driver.socketId, ERideFlowEvents.Offer, {
      ridePID: offer.ridePID,
    });

    /**
     * Inform the user that we have a compatible driver and we awaiting the driver response
     */
    this.socketService.emit(offer.requesterSocketId, ERideFlowEvents.OfferSent, driver);

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
   * @param {IOfferServer} offer
   * @param {IDriverData[]} list Next iteration list
   */
  async match(
    offer: IOfferServer,
    ride: IRide,
    list: Map<string, IDriverData> = this.drivers,
    runTimes = 0,
  ): Promise<IDriverData | null> {
    ++runTimes;

    const nextList = new Map<string, IDriverData>();
    const maxDistance = this.getDistance(runTimes);
    let currentDistance: number = Number.MAX_SAFE_INTEGER;
    let choiced: IDriverData | null = null;

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
        current.state !== EUserState.SEARCHING ||
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
    data: Partial<Omit<IOfferServer, "offerResponseTimeout">>,
  ): Promise<Omit<IOfferServer, "offerResponseTimeout">> {
    return this.setOrUpdateCache(CacheNamespaces.OFFERS, ridePID, data, {
      ex: CacheTTL.OFFERS,
    });
  }

  getOfferData(
    ridePID: string,
  ): Promise<Omit<IOfferServer, "offerResponseTimeout">> {
    return this.cacheService.get(CacheNamespaces.OFFERS, ridePID) as any;
  }

  /**
   * Get connection data
   * @param id Socket ID or User public ID
   */
  public async getConnectionData(id: string): Promise<IConnectionData> {
    const connection = await this.cacheService.get(
      CacheNamespaces.CONNECTIONS,
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
    data: Partial<IConnectionData>,
  ): Promise<IConnectionData> {
    return this.setOrUpdateCache(CacheNamespaces.CONNECTIONS, pid, data, {
      link: [data.socketId as string],
      ex: CacheTTL.CONNECTIONS,
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
    state: Partial<IDriverData>,
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
      this.socketService.nodes.emit(EServerNodesEvents.UpdateDriverState, {
        socketId,
        state,
      });
    }
  }
}
