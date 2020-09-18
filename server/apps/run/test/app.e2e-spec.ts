/**
 * @group e2e/run
 */
import { Server as HttpServer } from "http";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppModule } from "../src/app.module";
import IOClient from "socket.io-client";
import IORedis from "ioredis";
import { parsers, auth } from "extensor";
import {
  EVENTS,
  serverEventsSchemas,
  Setup,
  OfferResponse,
  CANCELATION_RESPONSE,
  PickingUpPath,
} from "../src/events";
import { NAMESPACES } from "../src/constants";
import { SocketAdapter, SocketService } from "@app/socket";
import {
  Ride,
  RidePayMethods,
  RideRepository,
  RideTypes,
  User,
  USERS_ROLES,
} from "@app/repositories";
import { combineLatest, from, fromEvent } from "rxjs";
import faker from "faker";
import { SessionService } from "@app/session";
import { BROADCASTED_EVENTS } from "../src/constants";
import { UserRepository } from "@app/repositories";
import { AddressInfo } from "net";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createReplSetServer, mockUser, mockRide } from "@testing/testing";
import { ConfigModule, registerAs } from "@nestjs/config";
import ms from "ms";
//@ts-ignore
const polyline = require("google-polyline");

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

  const parser = parsers.schemapack(serverEventsSchemas as any);

  async function createAppNode() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
              DRIVER_RESPONSE_TIMEOUT: ms("3 seconds"), // 3 seconds
              INITIAL_RADIUS_SIZE: 1000,
              ADD_RADIUS_SIZE_EACH_ITERATION: 200,
              MAX_RADIUS_SIZE: 1800,
              SAFE_CANCELATION_WINDOW: ms("3 seconds"), // 3 minutes,
            })),
          ],
        }),
        AppModule,
      ],
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
  let voyager2Token: string;
  let driver1Token: string;
  let driver2Token: string;

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

    it("should throw ForbiddenException due to voyager trys access drivers namespace", async () => {
      const [voyager] = users;
      const voyagerSocket = createUserSocket(0, voyager, NAMESPACES.DRIVERS);

      await expect(
        authorizeClient(0, voyagerSocket, voyager1Token),
      ).rejects.toStrictEqual(new Error("Forbidden"));
    });
  });

  describe("Ride workflows", () => {
    async function standardOfferNAccept(overrides?: {
      rideOverride: Partial<Ride>;
    }) {
      const [voyager, , driver] = users;
      const voyagerSocket = createUserSocket(0, voyager);
      const driverSocket = createUserSocket(1, driver);

      const ride = mockRide({
        voyager: voyager._id,
        ...(overrides?.rideOverride || {}),
      });

      await appsNodes[0].rideRepository.create(ride);

      const [, driverToken1] = await Promise.all([
        authorizeClient(0, voyagerSocket, voyager1Token),
        authorizeClient(1, driverSocket, driver),
      ]);

      driver1Token = driverToken1;

      const driver1Setup: Setup = mockDriverSetup();

      // Drivers setup
      await new Promise((resolve) =>
        driverSocket.emit(EVENTS.DRIVER_SETUP, driver1Setup, resolve),
      );

      // Voyager 1 offer request
      voyagerSocket.emit(EVENTS.OFFER, { ridePID: ride.pid });

      const offer = await fromEventAsync(driverSocket, EVENTS.OFFER);

      expect(offer).toStrictEqual({ ridePID: ride.pid });

      driverSocket.emit(EVENTS.OFFER_RESPONSE, {
        ridePID: offer.ridePID,
        response: true,
      } as OfferResponse);

      const voyagerAcceptResponseListener = fromEvent(
        voyagerSocket,
        EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE,
      );
      const driverAcceptResponseListener = fromEvent(
        driverSocket,
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
        driverPID: driver.pid,
        ridePID: ride.pid,
      });
      expect(driverAcceptResponse).toMatchObject({ ridePID: ride.pid });

      return { ride, voyager, driver, voyagerSocket, driverSocket };
    }

    it("Handle ride workflow: offer -> accept -> picking-up -> running -> arrive", async () => {
      const {
        ride,
        voyager,
        voyagerSocket,
        driver,
        driverSocket,
      } = await standardOfferNAccept();

      const pickingUpPath: PickingUpPath = {
        ridePID: ride.pid,
        duration: 10,
        path: "fvly@xgkyEg@Ko@Gc@AB]Fk@B{@Dm@Hm@Bi@Bm@H{@F_AFi@Hq@Dy@Da@?MWEUE",
      };

      const pathDecoded = polyline.decode(pickingUpPath.path);

      driverSocket.emit(EVENTS.PICKING_UP_PATH, pickingUpPath);

      const pickingUpVoyagerEvent = await fromEventAsync(
        voyagerSocket,
        EVENTS.PICKING_UP_PATH,
      );

      expect(pickingUpVoyagerEvent).toStrictEqual(pickingUpPath);
      // TODO: driver position events, driver arrive event
    });

    describe("Cancelations", () => {
      it("Handle voyager safe cancelation", async () => {
        const {
          ride,
          voyagerSocket,
          driverSocket,
        } = await standardOfferNAccept();

        await expect(
          new Promise((resolve) =>
            voyagerSocket.emit(EVENTS.CANCEL_RIDE, ride.pid, resolve),
          ),
        ).resolves.toStrictEqual({
          status: CANCELATION_RESPONSE.SAFE,
        });

        await expect(
          fromEventAsync(driverSocket, EVENTS.CANCELED_RIDE),
        ).resolves.toStrictEqual({
          ridePID: ride.pid,
          status: CANCELATION_RESPONSE.SAFE,
        });
      });

      it("Handle voyager no-safe cancelation money pay method", async () => {
        const {
          ride,
          voyagerSocket,
          driverSocket,
        } = await standardOfferNAccept();

        await wait(3001);

        await expect(
          new Promise((resolve) =>
            voyagerSocket.emit(EVENTS.CANCEL_RIDE, ride.pid, resolve),
          ),
        ).resolves.toStrictEqual({
          status: CANCELATION_RESPONSE.PENDENCIE_ISSUED,
        });

        await expect(
          fromEventAsync(driverSocket, EVENTS.CANCELED_RIDE),
        ).resolves.toStrictEqual({
          ridePID: ride.pid,
          status: CANCELATION_RESPONSE.PENDENCIE_ISSUED,
        });
      }, 8000);

      it("Handle voyager no-safe cancelation credit card pay method", async () => {
        const {
          ride,
          voyagerSocket,
          driverSocket,
        } = await standardOfferNAccept({
          rideOverride: { payMethod: RidePayMethods.CreditCard },
        });

        await wait(3001);

        await expect(
          new Promise((resolve) =>
            voyagerSocket.emit(EVENTS.CANCEL_RIDE, ride.pid, resolve),
          ),
        ).resolves.toStrictEqual({
          status: CANCELATION_RESPONSE.CHARGE_REQUESTED,
        });

        await expect(
          fromEventAsync(driverSocket, EVENTS.CANCELED_RIDE),
        ).resolves.toStrictEqual({
          ridePID: ride.pid,
          status: CANCELATION_RESPONSE.CHARGE_REQUESTED,
        });
      }, 8000);
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
