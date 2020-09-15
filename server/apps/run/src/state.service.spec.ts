/**
 * @group unit/services/run-state
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, registerAs } from "@nestjs/config";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import { CacheModule, CacheService } from "@app/cache";
import { SocketModule, SocketService } from "@app/socket";
import { StateService } from "./state.service";
import EventEmitter from "eventemitter3";
import shortid from "shortid";
import {
  RideRepository,
  RidePayMethods,
  RideTypes,
  USERS_ROLES,
  Ride,
  RepositoryModule,
  RepositoryService,
} from "@app/repositories";
import {
  Setup,
  ConnectionData,
  Driver,
  EVENTS,
  OfferRequest,
  OfferResponse,
  OfferServer,
  DriverState,
} from "./events";
import faker from "faker";
import { CACHE_NAMESPACES, CACHE_TTL } from "./constants";
import deepmerge from "deepmerge";
import { Types } from "mongoose";
import {
  ConnectionDataNotFoundException,
  RideNotFoundException,
} from "./exceptions";
import { NODES_EVENTS } from "./events/nodes";

const wait = (ts: number) => new Promise((resolve) => setTimeout(resolve, ts));

describe("StateService", () => {
  let service: StateService;

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const rideRepository = {
    get: jest.fn(),
    update: jest.fn(),
  };

  const socketServiceMockFactory = () => {
    const nodeId = shortid.generate();
    const nodesEmitter = new EventEmitter();
    const nodes = {
      emit: jest.fn(),
      on: (event: any, handler: any) => {
        nodesEmitter.on(event, handler);
      },
    };
    const emit = jest.fn();
    const emitter = new EventEmitter();
    const on = (event: any, handler: any) => {
      socketService.emitter.on(event, handler);
    };
    return {
      nodeId,
      nodesEmitter,
      nodes,
      emit,
      emitter,
      on,
    };
  };

  let socketService = socketServiceMockFactory();

  const loggerMock = {
    setContext: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  function mockSetup(override: Partial<Setup> = {}): Setup {
    return deepmerge(
      {
        position: {
          latLng: [
            parseFloat(faker.address.latitude()),
            parseFloat(faker.address.longitude()),
          ],
          heading: 0,
          kmh: 30,
          ignored: [],
          pid: "",
        },
        config: {
          payMethods: [RidePayMethods.Money],
          types: [RideTypes.Normal],
          drops: ["any"],
        },
      },
      override,
    );
  }

  function mockConnection(
    override: Partial<ConnectionData> = {},
  ): ConnectionData {
    return deepmerge(
      {
        _id: new Types.ObjectId().toHexString(),
        pid: shortid.generate(),
        rate: faker.random.number({ min: 1, max: 5 }),
        p2p: faker.random.boolean(),
        socketId: shortid.generate(),
        mode: USERS_ROLES.VOYAGER,
        observers: [],
      },
      override,
    );
  }

  const basePosition = {
    latLng: [
      parseFloat(faker.address.latitude()),
      parseFloat(faker.address.longitude()),
    ],
    heading: 0,
    kmh: 30,
    ignored: [],
    pid: "",
  };

  const baseConfig = {
    payMethods: [RidePayMethods.Money],
    types: [RideTypes.Normal],
    drops: ["any"],
  };

  function mockPosition(override: Partial<Position> = {}): Position {
    return deepmerge(
      {
        latLng: [
          parseFloat(faker.address.latitude()),
          parseFloat(faker.address.longitude()),
        ],
        heading: 0,
        kmh: 30,
        ignored: [],
        pid: "",
      },
      override,
    );
  }

  function mockDriverPosition(override: Partial<Driver> = {}): Driver {
    return {
      _id: shortid.generate(),
      state: DriverState.SEARCHING,
      pid: shortid.generate(),
      rate: faker.random.number({ min: 1, max: 4 }),
      p2p: faker.random.boolean(),
      socketId: shortid.generate(),
      position: {
        latLng: [-9.575557, -35.779208],
        heading: 0,
        kmh: 30,
        ignored: [],
        pid: "",
      },
      config: {
        ...baseConfig,
      },
      ...override,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            registerAs("MATCH", () => ({
              MAX_ITERATION: 10,
              ITERATION_INTERVAL: 100,
              TOO_AWAY: 2000,
            })),
            registerAs("OFFER", () => ({
              DRIVER_RESPONSE_TIMEOUT: 3000, // 3 seconds
              INITIAL_RADIUS_SIZE: 1000,
              ADD_RADIUS_SIZE_EACH_ITERATION: 200,
              MAX_RADIUS_SIZE: 1800,
            })),
          ],
        }),
        LoggerModule.forRoot(),
        CacheModule,
        RepositoryModule,
        SocketModule,
      ],
      providers: [StateService],
    })
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(CacheService)
      .useValue(cacheMock)
      .overrideProvider(RideRepository)
      .useValue(rideRepository)
      .overrideProvider(SocketService)
      .useValue(socketService)
      .overrideProvider(PinoLogger)
      .useValue(loggerMock)
      .compile();

    service = module.get<StateService>(StateService);
  });

  afterEach(() => {
    socketService = socketServiceMockFactory();

    jest.resetAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(loggerMock.setContext.mock.calls[0][0]).toBe(StateService.name);
  });

  describe("setupDriverEvent", () => {
    it("should throw ConnectionDataNotFoundException", async () => {
      cacheMock.get.mockResolvedValue(null);

      const setup = mockSetup();

      const socketId = shortid.generate();

      const rejectExpected = new ConnectionDataNotFoundException(socketId);

      await expect(
        service.setupDriverEvent(socketId, setup),
      ).rejects.toStrictEqual(rejectExpected);

      socketService.emitter.emit(EVENTS.DRIVER_SETUP, {
        socketId,
        data: mockSetup(),
      });

      await wait(100);

      expect(loggerMock.error.mock.calls[0][0]).toStrictEqual(rejectExpected);
    });

    it("should insert driver in the list", async () => {
      cacheMock.get.mockResolvedValue(null);

      const setup = mockSetup();
      const connection = mockConnection({ mode: USERS_ROLES.DRIVER });

      await service.setupDriverEvent(connection.socketId, setup, connection);

      expect(
        service.drivers.find(
          (driver) => driver.socketId === connection.socketId,
        ),
      ).toBeDefined();
    });

    it("should update driver in the list", async () => {
      const setup1 = mockSetup();
      const setup2 = mockSetup();
      const setup3 = mockSetup();
      const setupOverride = mockSetup();

      const connection1 = mockConnection({ mode: USERS_ROLES.DRIVER });
      const connection2 = mockConnection({ mode: USERS_ROLES.DRIVER });
      const connection3 = mockConnection({ mode: USERS_ROLES.DRIVER });

      service.drivers = [
        { ...setup1, ...connection1 },
        { ...setup2, ...connection2 },
        { ...setup3, ...connection3 },
      ];

      await service.setupDriverEvent(
        connection2.socketId,
        setupOverride,
        connection2,
      );

      expect(
        service.drivers.find(
          (driver) => driver.socketId === connection2.socketId,
        ),
      ).toStrictEqual({ ...connection2, ...setupOverride });

      cacheMock.get.mockResolvedValueOnce(connection3);

      const fromAnotherNodeData = mockSetup();

      socketService.emitter.emit(EVENTS.DRIVER_SETUP, {
        socketId: connection3.socketId,
        data: fromAnotherNodeData,
      });

      await wait(100);

      expect(
        service.drivers.find(
          (driver) => driver.socketId === connection3.socketId,
        ),
      ).toStrictEqual({ ...connection3, ...fromAnotherNodeData });
    });
  });

  describe("findDriver", () => {
    it("should find", () => {
      const setup = mockSetup();
      const connection = mockConnection({ mode: USERS_ROLES.DRIVER });

      service.drivers = [{ ...setup, ...connection }];

      expect(service.findDriver(connection.socketId)).toBeDefined();
    });

    it("should don't find", () => {
      const setup = mockSetup();
      const connection = mockConnection({ mode: USERS_ROLES.DRIVER });

      service.drivers = [{ ...setup, ...connection }];

      expect(service.findDriver(shortid.generate())).toBeUndefined();
      expect(loggerMock.info).toBeCalledTimes(1);
    });
  });

  ([
    {
      functionName: "positionEvent",
      field: "position",
      nodeEvent: EVENTS.POSITION,
    },
    {
      functionName: "setConfigurationEvent",
      field: "config",
      nodeEvent: EVENTS.CONFIGURATION,
    },
  ] as {
    functionName: "positionEvent" | "setConfigurationEvent";
    field: "position" | "config";
    nodeEvent: EVENTS;
  }[]).forEach(({ functionName, field, nodeEvent }) => {
    describe(functionName, () => {
      it("should don't do nothing due to not found driver", async () => {
        const setup = mockSetup();
        const connection = mockConnection({ mode: USERS_ROLES.DRIVER });
        const data = (setup as any)[field];

        service.drivers = [{ ...setup, ...connection }];
        service[functionName](shortid.generate(), data);
        expect(loggerMock.info).toBeCalledTimes(1);

        socketService.emitter.emit(nodeEvent, {
          socketId: shortid.generate(),
          data,
        });

        await wait(100);

        expect(loggerMock.info).toHaveBeenCalled();
      });

      it("should update", async () => {
        const setup = mockSetup();
        const connection = mockConnection({ mode: USERS_ROLES.DRIVER });
        const expected = mockSetup()[field];

        service.drivers = [{ ...setup, ...connection }];
        service[functionName](connection.socketId, expected as any);

        const driver = service.findDriver(connection.socketId) as any;

        expect(driver).toBeDefined();
        expect(driver[field]).toStrictEqual(expected);
        expect(loggerMock.info).toBeCalledTimes(0);

        const fromAnotherNodeData = mockSetup()[field];

        socketService.emitter.emit(nodeEvent, {
          socketId: connection.socketId,
          data: fromAnotherNodeData,
        });

        await wait(100);

        expect(driver[field]).toStrictEqual(fromAnotherNodeData);
      });
    });
  });

  describe("offerResponseEvent", () => {
    it("should not execute due to not generated the offer", async () => {
      const offerResponse: OfferResponse = {
        ridePID: shortid.generate(),
        response: true,
      };
      const socketId = shortid.generate();

      await service.offerResponseEvent(socketId, offerResponse);

      socketService.emitter.emit(EVENTS.OFFER_RESPONSE, {
        socketId,
        data: offerResponse,
      });

      await wait(100);
      expect(cacheMock.get).toBeCalledTimes(0);
    });

    it("should throw ConnectionDataNotFoundException", async () => {
      const ridePID = shortid.generate();
      (service as any).offers = [{ ride: { pid: ridePID } }];

      const offerResponse: OfferResponse = {
        ridePID,
        response: true,
      };

      const socketId = shortid.generate();

      const rejectExpected = new ConnectionDataNotFoundException(socketId);

      await expect(
        service.offerResponseEvent(socketId, offerResponse),
      ).rejects.toStrictEqual(rejectExpected);

      socketService.emitter.emit(EVENTS.OFFER_RESPONSE, {
        socketId,
        data: offerResponse,
      });

      await wait(100);
      expect(loggerMock.error.mock.calls[0][0]).toStrictEqual(rejectExpected);
    });

    it(`should emit ${EVENTS.DELAYED_OFFER_RESPONSE}`, async () => {
      const ridePID = shortid.generate();
      const driverPID = shortid.generate();
      const otherDriverPID = shortid.generate();
      const driverConnectionData = { pid: driverPID };

      (service as any).offers = [
        { ride: { pid: ridePID }, offeredTo: otherDriverPID },
      ];

      const offerResponse: OfferResponse = {
        ridePID,
        response: true,
      };

      const socketId = shortid.generate();

      await service.offerResponseEvent(
        socketId,
        offerResponse,
        driverConnectionData as any,
      );

      expect(socketService.emit.mock.calls[0][0]).toBe(socketId);
      expect(socketService.emit.mock.calls[0][1]).toBe(
        EVENTS.DELAYED_OFFER_RESPONSE,
      );
      expect(socketService.emit.mock.calls[0][2]).toBe(true);
    });

    it("should handle a negative response", async () => {
      const ridePID = shortid.generate();
      const driverPID = shortid.generate();
      const driverConnectionData = { pid: driverPID };

      const offer: OfferServer = {
        ride: { pid: ridePID } as any,
        offeredTo: driverPID,
        requesterSocketId: shortid.generate(),
        ignoreds: [""],
        offerResponseTimeout: setTimeout(() => {}, 1000000),
      };

      (service as any).offers = [offer];

      const offerResponse: OfferResponse = {
        ridePID,
        response: false,
      };

      const socketId = shortid.generate();

      await service.offerResponseEvent(
        socketId,
        offerResponse,
        driverConnectionData as any,
      );

      expect(offer.ignoreds.includes(driverConnectionData.pid));
      expect((offer.offerResponseTimeout as any)._destroyed).toBeTruthy();
    });

    it("should handle a positive response", async () => {
      const ridePID = shortid.generate();
      const driverPID = shortid.generate();
      const driverID = shortid.generate();
      const driverSocketId = shortid.generate();
      const driverConnectionData = {
        _id: driverID,
        pid: driverPID,
        p2p: faker.random.boolean(),
        socketId: driverSocketId,
      };

      const voyagerPID = shortid.generate();
      const voyagerSocketId = shortid.generate();
      const voyagerConnectionData = {
        pid: voyagerPID,
        p2p: faker.random.boolean(),
        socketId: voyagerSocketId,
      };

      cacheMock.get.mockResolvedValueOnce(voyagerConnectionData);
      cacheMock.get.mockResolvedValueOnce(driverConnectionData);
      cacheMock.get.mockResolvedValueOnce(voyagerConnectionData);

      const offer: OfferServer = {
        ride: { pid: ridePID } as any,
        offeredTo: driverPID,
        requesterSocketId: voyagerSocketId,
        ignoreds: [""],
        offerResponseTimeout: setTimeout(() => {}, 1000000),
      };

      (service as any).offers = [offer];

      const offerResponse: OfferResponse = {
        ridePID,
        response: true,
      };

      await service.offerResponseEvent(
        driverSocketId,
        offerResponse,
        driverConnectionData as any,
      );

      const cacheCalls = cacheMock.set.mock.calls;

      expect((offer.offerResponseTimeout as any)._destroyed).toBeTruthy();
      expect(cacheCalls[0][0]).toBe(CACHE_NAMESPACES.OFFERS);
      expect(cacheCalls[0][1]).toBe(offer.ride.pid);
      expect(cacheCalls[0][2]).toMatchObject({ ...offer, driverSocketId });
      expect(typeof cacheCalls[0][2].acceptTimestamp).toBe("number");
      expect(cacheCalls[0][3]).toStrictEqual({ ex: CACHE_TTL.OFFERS });

      const rideDataCalls = rideRepository.update.mock.calls;

      expect(rideDataCalls[0][0]).toStrictEqual({ pid: offer.ride.pid });
      expect(rideDataCalls[0][1]).toStrictEqual({ driver: driverID });

      const [driverEmit, voyagerEmit] = socketService.emit.mock.calls;

      expect(driverEmit[0]).toBe(driverSocketId);
      expect(driverEmit[1]).toBe(EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE);
      expect(driverEmit[2]).toMatchObject({ ridePID: offer.ride.pid });
      expect(typeof driverEmit[2].timestamp).toBe("number");

      expect(voyagerEmit[0]).toBe(voyagerSocketId);
      expect(voyagerEmit[1]).toBe(EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE);
      expect(voyagerEmit[2]).toMatchObject({
        ridePID: offer.ride.pid,
        driverPID: driverPID,
      });
      expect(typeof voyagerEmit[2].timestamp).toBe("number");

      expect(cacheMock.get.mock.calls[0][0]).toBe(CACHE_NAMESPACES.CONNECTIONS);
      expect(cacheMock.get.mock.calls[0][1]).toBe(voyagerSocketId);

      const [
        ,
        driverUpdateCalls,
        voyagerUpdateCalls,
      ] = cacheMock.set.mock.calls;

      expect(driverUpdateCalls[0]).toBe(CACHE_NAMESPACES.CONNECTIONS);
      expect(driverUpdateCalls[1]).toBe(driverPID);
      expect(driverUpdateCalls[2]).toStrictEqual({
        ...driverConnectionData,
        observers: [
          { socketId: voyagerSocketId, p2p: voyagerConnectionData.p2p },
        ],
      });

      expect(voyagerUpdateCalls[0]).toBe(CACHE_NAMESPACES.CONNECTIONS);
      expect(voyagerUpdateCalls[1]).toBe(voyagerPID);
      expect(voyagerUpdateCalls[2]).toStrictEqual({
        ...voyagerConnectionData,
        observers: [
          { socketId: driverSocketId, p2p: driverConnectionData.p2p },
        ],
      });
    });
  });

  describe("createOffer", () => {
    it("should throw RideNotFoundException", async () => {
      rideRepository.get.mockResolvedValueOnce(null);
      const ridePID = shortid.generate();

      const offerRequest: OfferRequest = {
        ridePID,
      };

      await expect(
        service.createOffer(offerRequest, {} as any),
      ).rejects.toStrictEqual(new RideNotFoundException());

      const [getCalls] = rideRepository.get.mock.calls;

      expect(getCalls[0]).toStrictEqual({ pid: ridePID });
    });

    it("should create an offer", async () => {
      const ridePID = shortid.generate();
      const socketId = shortid.generate();
      const connection = { socketId };
      const offerRequest: OfferRequest = { ridePID };

      rideRepository.get.mockResolvedValueOnce({ pid: ridePID });

      await service.createOffer(offerRequest, connection as any, false);

      const offer = service.offers.find((offer) => offer.ride.pid === ridePID);

      expect(offer).toBeDefined();
      const [cacheSetCall] = cacheMock.set.mock.calls;

      expect(cacheSetCall[0]).toBe(CACHE_NAMESPACES.OFFERS);
      expect(cacheSetCall[1]).toBe(ridePID);
      expect(cacheSetCall[2]).toStrictEqual(offer);
      expect(cacheSetCall[3]).toStrictEqual({ ex: CACHE_TTL.OFFERS });
    });
  });

  describe("offerRide", () => {
    const routeStartLatLng: [number, number] = [-9.572477, -35.776619];
    const tooAwayPoint: [number, number] = [-9.572178, -35.754305];

    const driverToAway = mockDriverPosition({
      pid: "toAway",
      position: { ...basePosition, latLng: tooAwayPoint },
    });
    const driverIgnored = mockDriverPosition({
      pid: "ignored",
    });
    const driverIDLE = mockDriverPosition({
      pid: "idle",
      state: DriverState.IDLE,
    });
    const driverDiferentDistricts = mockDriverPosition({
      pid: "diferentDistrict",
      config: {
        ...baseConfig,
        drops: ["centro", "farol"],
      },
    });
    const driverDifferentPaymethod = mockDriverPosition({
      pid: "diferentPayMethod",
      config: {
        ...baseConfig,
        payMethods: [RidePayMethods.CreditCard],
      },
    });
    const driverDifferentType = mockDriverPosition({
      pid: "diferentType",
      config: {
        ...baseConfig,
        types: [RideTypes.VIG],
      },
    });
    const driverElegible = mockDriverPosition({
      pid: "firstElegible",
    });
    const driverSecondElegible = mockDriverPosition({
      pid: "secondElegible",
      position: { ...basePosition, latLng: [-9.574551, -35.779852] },
    });
    const driverMoreNearElegible = mockDriverPosition({
      pid: "moreNearElegible",
      position: {
        ...basePosition,
        latLng: [-9.573539, -35.778969],
      },
    });
    const driverBetterRated = mockDriverPosition({
      pid: "betterRated",
      rate: 5,
      position: {
        ...basePosition,
        latLng: [-9.573539, -35.778969],
      },
    });

    const ride: Partial<Ride> = {
      pid: shortid.generate(),
      route: {
        start: {
          coord: routeStartLatLng,
          primary: faker.address.streetAddress(),
          secondary: faker.address.streetAddress(),
          district: "",
        },
        end: {
          coord: [
            parseFloat(faker.address.latitude()),
            parseFloat(faker.address.longitude()),
          ],
          primary: faker.address.streetAddress(),
          secondary: faker.address.streetAddress(),
          district: "prado",
        },
        path: "",
        distance: 23.4,
        duration: 25,
      },
    };

    it(`should get a ${EVENTS.OFFER_GOT_TOO_LONG}`, async () => {
      const ride: Partial<Ride> = {};

      const voyagerSocketId = shortid.generate();

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      await service.offerRide(offerObject);

      const [tooLongEvent] = socketService.emit.mock.calls;

      expect(tooLongEvent[0]).toBe(voyagerSocketId);
      expect(tooLongEvent[1]).toBe(EVENTS.OFFER_GOT_TOO_LONG);
      expect(tooLongEvent[2]).toBe(true);
    });

    it("should get a match driver and pass through all conditionals", async () => {
      service.drivers = [
        driverToAway,
        driverIgnored,
        driverIDLE,
        driverDiferentDistricts,
        driverDifferentPaymethod,
        driverDifferentType,
        driverElegible,
        driverSecondElegible,
        driverMoreNearElegible,
        driverBetterRated,
      ];

      const voyagerSocketId = shortid.generate();

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [driverIgnored.pid],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      await service.offerRide(offerObject);

      expect(offerObject.offeredTo).toBe(driverBetterRated.pid);

      const [driverInfoEvent, voyagerInfoEvent] = socketService.emit.mock.calls;

      expect(driverInfoEvent[0]).toBe(driverBetterRated.socketId);
      expect(driverInfoEvent[1]).toBe(EVENTS.OFFER);
      expect(driverInfoEvent[2]).toStrictEqual({
        ridePID: ride.pid,
      });

      expect(voyagerInfoEvent[0]).toBe(voyagerSocketId);
      expect(voyagerInfoEvent[1]).toBe(EVENTS.OFFER_SENT);
      expect(voyagerInfoEvent[2]).toStrictEqual(driverBetterRated);

      clearTimeout((offerObject as any).offerResponseTimeout);
    });

    it("should execute a driver timeout response", async () => {
      service.drivers = [
        driverToAway,
        driverIgnored,
        driverIDLE,
        driverDiferentDistricts,
        driverDifferentPaymethod,
        driverDifferentType,
        driverElegible,
        driverMoreNearElegible,
        driverBetterRated,
      ];

      const voyagerSocketId = shortid.generate();

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [driverIgnored.pid],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      await service.offerRide(offerObject);

      expect(offerObject.offeredTo).toBe(driverBetterRated.pid);

      const [driverInfoEvent, voyagerInfoEvent] = socketService.emit.mock.calls;

      expect(driverInfoEvent[0]).toBe(driverBetterRated.socketId);
      expect(driverInfoEvent[1]).toBe(EVENTS.OFFER);
      expect(driverInfoEvent[2]).toStrictEqual({
        ridePID: ride.pid,
      });

      expect(voyagerInfoEvent[0]).toBe(voyagerSocketId);
      expect(voyagerInfoEvent[1]).toBe(EVENTS.OFFER_SENT);
      expect(voyagerInfoEvent[2]).toStrictEqual(driverBetterRated);

      await wait(3100);

      expect(offerObject.ignoreds.includes(driverBetterRated.pid)).toBeTruthy();
      expect(offerObject.offeredTo).toBe(driverMoreNearElegible.pid);
      clearTimeout((offerObject as any).offerResponseTimeout);
    });
  });

  describe("setOfferData", () => {
    it("should insert new value", async () => {
      const ridePID = shortid.generate();
      const voyagerSocketId = shortid.generate();
      const ride = {};

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      cacheMock.get.mockResolvedValue(null);

      await service.setOfferData(ridePID, offerObject);

      const [cacheSetCalls] = cacheMock.set.mock.calls;

      expect(cacheMock.get).toHaveBeenCalledTimes(1);
      expect(cacheSetCalls[0]).toBe(CACHE_NAMESPACES.OFFERS);
      expect(cacheSetCalls[1]).toBe(ridePID);
      expect(cacheSetCalls[2]).toStrictEqual(offerObject);
      expect(cacheSetCalls[3]).toStrictEqual({
        ex: CACHE_TTL.OFFERS,
      });
    });

    it("should update the value", async () => {
      const ridePID = shortid.generate();
      const voyagerSocketId = shortid.generate();
      const ride = {};

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      cacheMock.get.mockResolvedValue({
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: ["currentIgnored"],
        offeredTo: null,
        offerResponseTimeout: null,
      });

      await service.setOfferData(ridePID, offerObject);

      const [cacheSetCalls] = cacheMock.set.mock.calls;

      expect(cacheMock.get).toHaveBeenCalledTimes(1);
      expect(cacheSetCalls[0]).toBe(CACHE_NAMESPACES.OFFERS);
      expect(cacheSetCalls[1]).toBe(ridePID);
      expect(cacheSetCalls[2]).toStrictEqual({
        ...offerObject,
        ignoreds: ["currentIgnored"],
      });
      expect(cacheSetCalls[3]).toStrictEqual({
        ex: CACHE_TTL.OFFERS,
      });
    });
  });

  describe("setOfferData", () => {
    it("should return the value", async () => {
      const ridePID = shortid.generate();
      const voyagerSocketId = shortid.generate();
      const ride = {};

      const offerObject: OfferServer = {
        ride: ride as any,
        requesterSocketId: voyagerSocketId,
        ignoreds: [],
        offeredTo: null,
        offerResponseTimeout: null,
      };

      cacheMock.get.mockResolvedValue(offerObject);
      await expect(service.getOfferData(ridePID)).resolves.toStrictEqual(
        offerObject,
      );
    });
  });

  describe("updateDriver", () => {
    it("should not execute", () => {
      const socketId = "not-in-list";
      service.updateDriver(socketId, { state: DriverState.SEARCHING });

      expect(loggerMock.warn).toBeCalled();
    });

    it("should update from node event", async () => {
      const driverState = mockDriverPosition();

      service.drivers = [driverState];

      service.updateDriver(
        driverState.socketId,
        { state: DriverState.IDLE },
        true,
      );

      expect(service.drivers[0].state).toBe(DriverState.IDLE);

      socketService.nodesEmitter.emit(NODES_EVENTS.UPDATE_DRIVER_STATE, {
        socketId: driverState.socketId,
        state: { state: DriverState.SEARCHING },
      });

      await wait(100);

      expect(service.drivers[0].state).toBe(DriverState.SEARCHING);
    });

    it("should update and emit", () => {
      const driverState = mockDriverPosition();
      const updateTo = {
        state: DriverState.IDLE,
        position: {
          latLng: [-9.575562, -35.779218],
          heading: 0,
          kmh: 30,
          ignored: [],
          pid: "",
        },
      } as any;

      service.drivers = [driverState];

      service.updateDriver(driverState.socketId, updateTo);

      expect(service.drivers[0].state).toBe(DriverState.IDLE);

      const [nodesEmitCalls] = socketService.nodes.emit.mock.calls;

      expect(nodesEmitCalls[0]).toBe(NODES_EVENTS.UPDATE_DRIVER_STATE);
      expect(nodesEmitCalls[1]).toStrictEqual({
        socketId: driverState.socketId,
        state: updateTo,
      });
    });
  });
});
