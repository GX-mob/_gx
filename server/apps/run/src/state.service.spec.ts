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
import { Setup, Connection, Driver, EVENTS } from "./events";
import faker from "faker";
import { WsException } from "@nestjs/websockets";
import { EXCEPTIONS } from "./constants";
import deepmerge from "deepmerge";
import { Types } from "mongoose";

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
    it("should throw error due not found connection data", async () => {
      cacheMock.get.mockResolvedValue(null);

      const setup = mockSetup();

      await expect(
        service.setupDriverEvent(shortid.generate(), setup),
      ).rejects.toStrictEqual(
        new WsException(EXCEPTIONS.CONNECTION_DATA_NOT_FOUND),
      );

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
});
