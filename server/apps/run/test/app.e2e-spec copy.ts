/**
 * @group e2e/run
 */
import { Server as HttpServer } from "http";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppModule } from "../src/app.module";
import { Server } from "socket.io";
import IOClient, { Socket } from "socket.io-client";
import IORedis from "ioredis";
import { parsers, auth } from "extensor";
import {
  EVENTS,
  serverEventsSchemas,
  Position,
  OfferRequest,
  Setup,
  ConnectionData,
} from "../src/events";
import { EXCEPTIONS, NAMESPACES } from "../src/constants";
import { SocketAdapter, SocketService } from "@app/socket";
import {
  RepositoryService,
  Ride,
  RidePayMethods,
  RideRepository,
  RideStatus,
  RideTypes,
  TRoute,
  User,
  USERS_ROLES,
} from "@app/repositories";
import { combineLatest, from, fromEvent } from "rxjs";
import faker from "faker";
import { SessionService } from "@app/session";
import { StateService } from "../src/state.service";
import { BROADCASTED_EVENTS } from "../src/constants";
import { CacheService } from "@app/cache";
import { UserRepository } from "@app/repositories";
import { AddressInfo } from "net";

describe("RidesWSService (e2e)", () => {
  const appsNodes: {
    httpServer: HttpServer;
    app: INestApplication;
    userRepository: UserRepository;
    rideRepository: RideRepository;
    sessionService: SessionService;
  }[] = [];
  // Voyager, Voyager, Driver, Driver
  let users: User[] = [];

  const parser = parsers.schemapack(serverEventsSchemas);

  let httpServerNode1: Server;
  let httpServerNode2: Server;
  let appNode1: INestApplication;
  let appNode2: INestApplication;

  let voyagerClient: typeof Socket; // connects to node 1
  let voyagerClient2: typeof Socket; // connects to node 1
  let driverClient: typeof Socket; // connects to node 2
  let driverClient2: typeof Socket; // connects to node 2

  const sessionService = {
    verify: jest.fn(),
    hasPermission: jest.fn(),
  };

  const rideRepositoryMock = {
    get: jest.fn(),
  };

  let stateService1: StateService;
  let stateService2: StateService;

  let cacheServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  async function createAppNode() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PinoLogger)
      .useValue({
        setContext: () => {},
        error: console.log,
        info: () => {},
        warn: () => {},
      })
      .overrideProvider(RepositoryService)
      .useValue({})
      .compile();

    const app = moduleFixture.createNestApplication();

    const redis = {
      pubClient: new IORedis(process.env.REDIS_HOST),
      subClient: new IORedis(process.env.REDIS_HOST),
    };

    const parser = parsers.schemapack(serverEventsSchemas);

    app.useWebSocketAdapter(
      new SocketAdapter(app, {
        parser,
        redis,
        broadcastedEvents: BROADCASTED_EVENTS,
      }),
    );

    await app.init();

    const httpServer = app.getHttpServer();
    // Repositories
    const userRepository = app.get(UserRepository);
    const rideRepository = app.get(RideRepository);
    // Services
    const sessionService = app.get(SessionService);
    const appIdx = appsNodes.push({
      app,
      httpServer,
      userRepository,
      rideRepository,
      sessionService,
    });

    app.get(SocketService).nodeId = `APP_NODE_${appIdx}`;

    return appsNodes[appIdx];
  }

  async function createMockUsers() {
    const [{ userRepository }] = appsNodes;

    const voyager1 = mockUser();
    const voyager2 = mockUser();
    const driver1 = mockUser({
      roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
    });
    const driver2 = mockUser({
      roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
    });

    users = await Promise.all([
      userRepository.create(voyager1),
      userRepository.create(voyager2),
      userRepository.create(driver1),
      userRepository.create(driver2),
    ]);
  }

  beforeAll(async () => {
    await createAppNode();
    await createAppNode();

    const [node1, node2] = appsNodes;

    await createMockUsers();

    await node1.app.listen(0);
    await node2.app.listen(0);
  });

  function createUserSocket(
    appNodeIndex: number,
    user: User,
    options: SocketIOClient.ConnectOpts = {},
  ) {
    const { httpServer } = appsNodes[appNodeIndex];
    const { port } = httpServer.address() as AddressInfo;

    const namespace = user.roles.includes(USERS_ROLES.DRIVER)
      ? NAMESPACES.DRIVERS
      : NAMESPACES.VOYAGERS;

    return IOClient(`ws://localhost:${port}${namespace}`, {
      ...options,
      parser: parser.parser,
    } as any);
  }

  async function authorizeClient(
    appNodeIdx: number,
    socket: SocketIOClient.Socket,
    user: User,
  ) {
    const { sessionService } = appsNodes[appNodeIdx];
    const { token } = await sessionService.create(user, null, null);

    await auth.client(socket, { token }).catch(console.log);
  }

  beforeEach(async () => {
    appNode1 = await mockNodeApplication();
    appNode2 = await mockNodeApplication();

    appNode1.get(SocketService).nodeId = "NODE_1";
    appNode2.get(SocketService).nodeId = "NODE_2";

    stateService1 = appNode1.get(StateService);
    stateService2 = appNode2.get(StateService);

    await appNode1.listen(0);
    await appNode2.listen(0);

    httpServerNode1 = appNode1.getHttpServer();
    httpServerNode2 = appNode2.getHttpServer();

    const httpServerAddr1 = httpServerNode1.address() as any;
    const httpServerAddr2 = httpServerNode2.address() as any;

    voyagerClient = IOClient(
      `ws://localhost:${httpServerAddr1.port}${NAMESPACES.VOYAGERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );

    voyagerClient2 = IOClient(
      `ws://localhost:${httpServerAddr1.port}${NAMESPACES.VOYAGERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );

    driverClient = IOClient(
      `ws://localhost:${httpServerAddr2.port}${NAMESPACES.DRIVERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );

    driverClient2 = IOClient(
      `ws://localhost:${httpServerAddr2.port}${NAMESPACES.DRIVERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );
  });

  afterEach(async () => {
    jest.resetAllMocks();
    voyagerClient.close();
    voyagerClient2.close();
    driverClient.close();
    driverClient2.close();
    await appNode1.close();
    await appNode2.close();
  });

  describe("Authorizations", () => {
    it("should connect", async () => {
      await connectAndAuthUsers();

      expect(voyagerClient.connected).toBeTruthy();
      expect(driverClient.connected).toBeTruthy();
    });

    it("should throw ForbiddenException", (done) => {
      const voyagerMock = mockUser();
      sessionService.verify.mockResolvedValue({ user: voyagerMock });

      sessionService.hasPermission.mockReturnValue(false);

      voyagerClient.connect();

      voyagerClient.on("connect", () => {
        auth.client(voyagerClient, { token: 1 }, (err) => {
          expect((err as Error).message).toBe("Forbidden");
          done();
        });
      });
    });
  });

  describe("Observables events", () => {
    it("should dispatch and ignore p2p users", async () => {
      const { driverMock } = await connectAndAuthUsers();
      const positionBody: Position = {
        latLng: [1, 1],
        heading: 0,
        kmh: 30,
        ignore: [],
        pid: "foo",
      };

      driverClient.emit(EVENTS.POSITION, positionBody);

      const notCall = jest.fn();

      voyagerClient2.on(EVENTS.POSITION, notCall);

      const position = await fromEventAsync(voyagerClient, EVENTS.POSITION);

      expect(position).toStrictEqual({
        ...positionBody,
        pid: driverMock.pid,
      });

      await wait(200);

      expect(notCall).toBeCalledTimes(0);
    });
  });

  describe("Offers", () => {
    it("should receive RideNotFoundException event", async () => {
      await connectAndAuthUsers();
      rideRepositoryMock.get.mockResolvedValueOnce(null);

      const offer: OfferRequest = {
        ridePID: faker.random.alphaNumeric(12),
      };

      voyagerClient.emit(EVENTS.OFFER, offer);

      await expect(
        fromEventAsync(voyagerClient, "exception"),
      ).resolves.toStrictEqual({ error: EXCEPTIONS.RIDE_NOT_FOUND });
    });

    it("should start offering", async () => {
      const { voyagerMock, driverMock } = await connectAndAuthUsers();
      const ride = mockRide({ voyager: voyagerMock._id });

      rideRepositoryMock.get.mockResolvedValue(ride);

      const setupEvent: Setup = {
        position: {
          latLng: [-9.573, -35.77997],
          heading: 0,
          kmh: 30,
          ignore: [],
          pid: "foo",
        },
        config: {
          payMethods: [RidePayMethods.Money, RidePayMethods.CreditCard],
          types: [RideTypes.Normal],
          drops: ["any"],
        },
      };

      const connData = {
        pid: driverMock.pid,
        observers: [{ socketId: driverClient.id, p2p: true }],
      } as any;

      cacheServiceMock.get.mockResolvedValue(connData);

      driverClient.emit(EVENTS.DRIVER_SETUP, setupEvent);

      await wait(100);

      voyagerClient.emit(EVENTS.OFFER, { ridePID: ride.pid });

      const offerEvent = await fromEventAsync(driverClient, EVENTS.OFFER);

      expect(offerEvent).toStrictEqual({ ridePID: ride.pid });
    });
  });

  function mockRide(override: Partial<Ride> = {}): Ride {
    const ride: Ride = {
      _id: faker.random.alphaNumeric(12),
      pid: faker.random.alphaNumeric(12),
      voyager: faker.random.alphaNumeric(12),
      type: RideTypes.Normal,
      payMethod: RidePayMethods.Money,
      country: "BR",
      area: "AL",
      subArea: "macieo",
      status: RideStatus.CREATED,
      route: {
        start: {
          coord: [-9.572722067985174, -35.77662958572795],
          primary: "Tv. Alcinio Teles",
          secondary: "Clima bom - Maceió/AL",
          district: "clima-bom",
        },
        end: {
          coord: [-9.57753, -35.77307],
          primary: "I Loce Coxinha",
          secondary: "R. São Paulo, 246 - Tabuleiro do Martins Maceió - AL",
          district: "tabuleiro-do-martins",
        },
        path:
          "ntly@|rjyER@BiAUG_AqBe@aBo@mB]kAHk@n@e@d@]p@c@`Am@jBqAhBmArBuA|AiAjAo@dAu@hA}@ZDh@bAbAxBfAdCz@hBLF",
        distance: 10,
        duration: 10,
      },
      costs: {
        base: 7,
        total: 7,
        distance: {
          total: 5,
          aditionalForLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
        duration: {
          total: 2,
          aditionalForLongRide: 0,
          aditionalForOutBusinessTime: 0,
        },
      },
      ...override,
    };

    return ride;
  }

  function mockUser(override: Partial<User> = {}): User {
    const user: User = {
      _id: faker.random.alphaNumeric(12),
      pid: faker.random.alphaNumeric(12),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      cpf: "123.456.789-09",
      phones: [faker.phone.phoneNumber()],
      emails: [faker.internet.email()],
      birth: faker.date.past(18),
      averageEvaluation: faker.random.number({ min: 1, max: 5 }),
      roles: [USERS_ROLES.VOYAGER],
      ...override,
    };
    return user;
  }

  async function mockNodeApplication() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PinoLogger)
      .useValue({
        setContext: () => {},
        error: console.log,
        info: () => {},
        warn: () => {},
      })
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(SessionService)
      .useValue(sessionService)
      .overrideProvider(RideRepository)
      .useValue(rideRepositoryMock)
      .overrideProvider(CacheService)
      .useValue(cacheServiceMock)
      .compile();

    const appNode = moduleFixture.createNestApplication();

    const redis = {
      pubClient: new IORedis(process.env.REDIS_HOST),
      subClient: new IORedis(process.env.REDIS_HOST),
    };

    const parser = parsers.schemapack(serverEventsSchemas);

    appNode.useWebSocketAdapter(
      new SocketAdapter(appNode, {
        parser,
        redis,
        broadcastedEvents: BROADCASTED_EVENTS,
      }),
    );

    await appNode.init();

    return appNode;
  }

  async function connectAndAuthUsers({
    voyagerOverride,
    voyager2Override,
    driverOverride,
    driver2Override,
  }: {
    voyagerOverride?: Partial<User>;
    voyager2Override?: Partial<User>;
    driverOverride?: Partial<User>;
    driver2Override?: Partial<User>;
  } = {}) {
    const voyagerMock = mockUser(voyagerOverride || {});
    const voyager2Mock = mockUser(voyager2Override || {});
    const driverMock = mockUser({
      roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
      ...(driverOverride || {}),
    });
    const driver2Mock = mockUser({
      roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
      ...(driver2Override || {}),
    });
    const voyagerToken = "voyagerToken";
    const voyager2Token = "voyager2Token";
    const driverToken = "driverToken";
    const driver2Token = "driver2Token";

    sessionService.verify.mockImplementation((token) => {
      return ({
        [voyagerToken]: { user: voyagerMock },
        [voyager2Token]: { user: voyager2Mock },
        [driverToken]: { user: driverMock },
        [driver2Token]: { user: driver2Mock },
      } as any)[token];
    });

    // Voyager node call
    jest.spyOn(stateService1, "setConnectionData").mockImplementation(
      async (pid) =>
        (({
          [voyagerMock.pid]: {
            pid: voyagerMock.pid,
            observers: [{ socketId: driverClient.id, p2p: true }],
          },
          [voyager2Mock.pid]: {
            pid: voyager2Mock.pid,
            observers: [{ socketId: driverClient.id, p2p: true }],
          },
        } as any)[pid]),
    );

    // Driver node call
    jest.spyOn(stateService2, "setConnectionData").mockImplementation(
      async (pid) =>
        (({
          [driverMock.pid]: {
            pid: driverMock.pid,
            p2p: true,
            observers: [
              { socketId: voyagerClient.id, p2p: false },
              { socketId: voyagerClient2.id, p2p: true },
            ],
          },
          [driver2Mock.pid]: {
            pid: driverMock.pid,
            p2p: true,
            observers: [
              { socketId: voyagerClient.id, p2p: false },
              { socketId: voyagerClient2.id, p2p: true },
            ],
          },
        } as any)[pid]),
    );

    sessionService.hasPermission.mockReturnValue(true);

    const voyagerConnect = fromEvent(voyagerClient, "connect");
    const voyager2Connect = fromEvent(voyagerClient2, "connect");
    const driverConnect = fromEvent(driverClient, "connect");
    const driver2Connect = fromEvent(driverClient2, "connect");

    voyagerClient.connect();
    voyagerClient2.connect();
    driverClient.connect();
    driverClient2.connect();

    await combineLatestAsync([
      voyagerConnect,
      voyager2Connect,
      driverConnect,
      driver2Connect,
    ]);

    const voyagerAuth = from(
      auth.client(voyagerClient, { token: voyagerToken }).catch(() => {}),
    );
    const voyager2Auth = from(
      auth.client(voyagerClient2, { token: voyager2Token }).catch(() => {}),
    );
    const driverAuth = from(
      auth.client(driverClient, { token: driverToken }).catch(() => {}),
    );
    const driverAuth2 = from(
      auth.client(driverClient2, { token: driver2Token }).catch(() => {}),
    );

    await combineLatestAsync([
      voyagerAuth,
      voyager2Auth,
      driverAuth,
      driverAuth2,
    ]);

    return {
      voyagerMock,
      voyager2Mock,
      driverMock,
      driver2Mock,
      voyagerToken,
      voyager2Token,
      driverToken,
      driver2Token,
    };
  }
});

function mockUser() {}

/*
  describe("Ride Offer workflow")

*/

/**
 * Utils
 */
const wait = (ts: number) => new Promise((resolve) => setTimeout(resolve, ts));
const fromEventAsync = (emitter: any, event: string) =>
  new Promise((resolve) => fromEvent(emitter, event).subscribe(resolve));
const combineLatestAsync = (observables: any[]) =>
  new Promise((resolve) => combineLatest(observables).subscribe(resolve));
