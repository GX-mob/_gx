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
  OfferResponse,
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
import { MongoMemoryReplSet } from "mongodb-memory-server";

import { createReplSetServer, mockUser, mockRide } from "@testing/testing";

describe("RidesWSService (e2e)", () => {
  let replSetServer: MongoMemoryReplSet;

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
    replSetServer = await createReplSetServer();
    process.env.DATABASE_URI = await replSetServer.getUri();
    process.env.REDIS_URI = `redis://${process.env.REDIS_HOST}:6379/0`;

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
    namespace?: NAMESPACES,
    options: SocketIOClient.ConnectOpts = {},
  ) {
    const { httpServer } = appsNodes[appNodeIndex];
    const { port } = httpServer.address() as AddressInfo;

    namespace =
      namespace || user.roles.includes(USERS_ROLES.DRIVER)
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
    user: User | string,
  ) {
    const { sessionService } = appsNodes[appNodeIdx];
    const token =
      typeof user === "string"
        ? user
        : (
            await sessionService.create(
              user,
              `Testing Client ${appNodeIdx}/${user.pid}`,
              faker.internet.ip(),
            )
          ).token;

    await auth.client(socket, { token });

    return token;
  }

  afterAll(async () => {
    await Promise.all(appsNodes.map(({ app }) => app.close()));
    await replSetServer.stop();
  });

  let voyager1Token: string;

  describe("Connection", () => {
    it("should deny due to provide an invalid token", async () => {
      const [voyager] = users;
      const voyagerSocket = createUserSocket(0, voyager);

      await expect(
        auth.client(voyagerSocket, {
          token: "xxxxx.yyyyy.zzzzz",
        }),
      ).rejects.toStrictEqual(new Error("invalid token"));
    });

    it("should authorize", async () => {
      const [voyager] = users;
      const voyagerSocket = createUserSocket(0, voyager);

      voyager1Token = await authorizeClient(0, voyagerSocket, voyager);
    });

    it("should throw ForbiddenException due to voyager trys acces drivers namesáce", async () => {
      const [voyager] = users;
      const voyagerSocket = createUserSocket(0, voyager, NAMESPACES.DRIVERS);

      await expect(
        authorizeClient(0, voyagerSocket, voyager1Token),
      ).rejects.toStrictEqual(new Error("Forbidden"));
    });
  });

  describe("Ride workflows", () => {
    it("Simple offer workflow", async () => {
      const [voyager, , driver1, driver2] = users;
      const voyagerSocket = createUserSocket(0, voyager);
      const driver1Socket = createUserSocket(1, driver1);
      const driver2Socket = createUserSocket(0, driver2);

      const rideVoyager1 = mockRide({ voyager: voyager._id });

      await appsNodes[0].rideRepository.create(rideVoyager1);

      await Promise.all([
        authorizeClient(0, voyagerSocket, voyager1Token),
        authorizeClient(1, driver1Socket, driver1),
        authorizeClient(0, driver2Socket, driver2),
      ]);

      const driver1Setup: Setup = mockDriverSetup();
      const driver2Setup: Setup = mockDriverSetup({
        config: {
          payMethods: [RidePayMethods.CreditCard],
          types: [RideTypes.Normal],
          drops: ["any"],
        },
      });

      // Drivers setup
      await new Promise((resolve) =>
        driver1Socket.emit(EVENTS.DRIVER_SETUP, driver1Setup, resolve),
      );
      await new Promise((resolve) =>
        driver2Socket.emit(EVENTS.DRIVER_SETUP, driver2Setup, resolve),
      );

      // Voyager 1 offer request
      voyagerSocket.emit(EVENTS.OFFER, { ridePID: rideVoyager1.pid });

      const offer = await fromEventAsync(driver1Socket, EVENTS.OFFER);

      expect(offer).toStrictEqual({ ridePID: rideVoyager1.pid });

      driver1Socket.emit(EVENTS.OFFER_RESPONSE, {
        ridePID: offer.ridePID,
        response: true,
      } as OfferResponse);

      const voyagerAcceptResponseListener = fromEvent(
        voyagerSocket,
        EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE,
      );
      const driverAcceptResponseListener = fromEvent(
        driver1Socket,
        EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE,
      );

      const [
        voyagerAcceptResponse,
        driverAcceptResponse,
      ] = (await combineLatestAsync([
        voyagerAcceptResponseListener,
        driverAcceptResponseListener,
      ])) as any;

      expect(voyagerAcceptResponse).toMatchObject({
        driverPID: driver1.pid,
        ridePID: rideVoyager1.pid,
      });
      expect(driverAcceptResponse).toMatchObject({ ridePID: rideVoyager1.pid });
    });
  });
});

function mockDriverSetup(override: Partial<Setup> = {}) {
  const setup: Setup = {
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
    ...override,
  };
  return setup;
}

/**
 * Utils
 */
const wait = (ts: number) => new Promise((resolve) => setTimeout(resolve, ts));
const fromEventAsync = <T = any>(emitter: any, event: string): Promise<T> =>
  new Promise((resolve) => fromEvent(emitter, event).subscribe(resolve as any));
const combineLatestAsync = (observables: any[]) =>
  new Promise((resolve) => combineLatest(observables).subscribe(resolve));
