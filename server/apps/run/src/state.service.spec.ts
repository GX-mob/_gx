/**
 * Data Service
 *
 * @group unit/services/run-state
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import { CacheModule, CacheService } from "@app/cache";
import { DataModule, DataService } from "@app/data";
import { SocketModule, SocketService } from "@app/socket";
import { StateService } from "./state.service";
import EventEmitter from "eventemitter3";
import shortid from "shortid";
import {
  DatabaseService,
  RidePayMethods,
  RideTypes,
  USERS_ROLES,
} from "@app/database";
import {
  Setup,
  Connection,
  Driver,
  EVENTS,
  OfferRequest,
  OfferResponse,
  OfferServer,
} from "./events";
import faker from "faker";
import { WsException } from "@nestjs/websockets";
import { EXCEPTIONS, OFFER, CACHE_NAMESPACES, CACHE_TTL } from "./constants";
import deepmerge from "deepmerge";
import { Types } from "mongoose";
import { ConnectionDataNotFoundException } from "./exceptions";

const wait = (ts: number) => new Promise((resolve) => setTimeout(resolve, ts));

describe("StateService", () => {
  let service: StateService;

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const dataMock = {
    rides: {
      get: jest.fn(),
      update: jest.fn(),
    },
  };

  let socketService = new (class {
    nodeId = shortid.generate();
    nodes = new EventEmitter();
    emit = jest.fn();
    emitter = new EventEmitter();
    on(event: any, handler: any) {
      this.emitter.on(event, handler);
    }
  })();

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
          pid: shortid.generate(),
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

  function mockConnection(override: Partial<Connection> = {}): Connection {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        CacheModule,
        DataModule,
        SocketModule,
      ],
      providers: [StateService],
    })
      .overrideProvider(DatabaseService)
      .useValue({})
      .overrideProvider(CacheService)
      .useValue(cacheMock)
      .overrideProvider(DataService)
      .useValue(dataMock)
      .overrideProvider(SocketService)
      .useValue(socketService)
      .overrideProvider(PinoLogger)
      .useValue(loggerMock)
      .compile();

    service = module.get<StateService>(StateService);
  });

  afterEach(() => {
    socketService = new (class {
      nodeId = shortid.generate();
      nodes = new EventEmitter();
      emit = jest.fn();
      emitter = new EventEmitter();
      on(event: any, handler: any) {
        this.emitter.on(event, handler);
      }
    })();
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

      await expect(
        service.setupDriverEvent(socketId, setup),
      ).rejects.toStrictEqual(new ConnectionDataNotFoundException(socketId));

      socketService.emitter.emit(EVENTS.DRIVER_SETUP, {
        socketId: shortid.generate(),
        data: mockSetup(),
      });

      await wait(100);

      expect(loggerMock.error).toBeCalledTimes(1);
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
      await service.offerResponseEvent(shortid.generate(), offerResponse);
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

      await expect(
        service.offerResponseEvent(socketId, offerResponse),
      ).rejects.toStrictEqual(new ConnectionDataNotFoundException(socketId));
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
        offerResponseTimeout: setTimeout(() => {},
        OFFER.DRIVER_RESPONSE_TIMEOUT),
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
        offerResponseTimeout: setTimeout(() => {},
        OFFER.DRIVER_RESPONSE_TIMEOUT),
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

      const rideDataCalls = dataMock.rides.update.mock.calls;

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
});
