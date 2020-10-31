/**
 * @group e2e/rides-flows
 * @group e2e/api/rides-flows
 */
import { Server as HttpServer } from "http";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
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
  Position,
} from "@shared/events";
import { NAMESPACES } from "../src/constants";
import { SocketAdapter, SocketService } from "@app/socket";
import {
  IRide,
  RidePayMethods,
  RideTypes,
  IUser,
  UserRoles,
  IVehicle,
  VehicleTypes,
} from "@shared/interfaces";
import { RideRepository, VehicleRepository } from "@app/repositories";
import { combineLatest, from, fromEvent } from "rxjs";
import faker from "faker";
import { AuthService } from "@app/auth";
import { BROADCASTED_EVENTS } from "../src/constants";
import { UserRepository } from "@app/repositories";
import { AddressInfo } from "net";
import { mockUser, mockRide } from "@testing/testing";
import { ConfigModule, registerAs } from "@nestjs/config";
import { CacheService } from "@app/cache";
import ms from "ms";
import { EXCEPTIONS } from "../src/constants";
//@ts-ignore
const polyline = require("google-polyline");

describe("RidesWSService (e2e)", () => {
  let cacheService: CacheService;
  const appsNodes: {
    httpServer: HttpServer;
    app: INestApplication;
    userRepository: UserRepository;
    rideRepository: RideRepository;
    sessionService: AuthService;
    vehicleRepository: VehicleRepository;
  }[] = [];
  // Voyager, Voyager, Driver, Driver
  let users: IUser[] = [];
  // Driver1, Driver2
  let vehicles: IVehicle[] = [];

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

    cacheService = app.get(CacheService);

    const redis = {
      pubClient: cacheService.redis.duplicate(),
      subClient: cacheService.redis.duplicate(),
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
    const vehicleRepository = app.get(VehicleRepository);
    // Services
    const sessionService = app.get(AuthService);
    const appIdx = appsNodes.push({
      app,
      httpServer,
      userRepository,
      rideRepository,
      sessionService,
      vehicleRepository,
    });

    app.get(SocketService).nodeId = `APP_NODE_${appIdx}`;

    return appsNodes[appIdx];
  }

  async function createMockUsers() {
    const [{ userRepository, vehicleRepository }] = appsNodes;

    const { _id: idv1, ...voyager1 } = mockUser();
    const { _id: idv2, ...voyager2 } = mockUser();
    const { _id: idd1, ...driver1 } = mockUser({
      roles: [UserRoles.VOYAGER, UserRoles.DRIVER],
    });
    const { _id: idd2, ...driver2 } = mockUser({
      roles: [UserRoles.VOYAGER, UserRoles.DRIVER],
    });

    async function findOrCreateUser(data: Omit<IUser, "_id">) {
      return (
        (await userRepository.get({ phones: data.phones[0] })) ||
        userRepository.create(data)
      );
    }

    users[0] = await findOrCreateUser(voyager1);
    users[1] = await findOrCreateUser(voyager2);
    users[2] = await findOrCreateUser(driver1);
    users[3] = await findOrCreateUser(driver2);

    // Vehicles
    const { vehicleMetadataModel } = vehicleRepository;

    const { _id } =
      (await vehicleMetadataModel.find({ name: "Vehicle name" }))[0] ||
      (await vehicleMetadataModel.create({
        name: "Vehicle name",
        manufacturer: "Vehicle Manufacturer",
        type: VehicleTypes.HATCH,
      }));

    vehicles[0] =
      (await vehicleRepository.get({ plate: "ABCD-1234" })) ||
      (await vehicleRepository.create({
        plate: "ABCD-1234",
        year: 2012,
        metadata: _id,
        owner: users[2]._id,
      }));

    vehicles[1] =
      (await vehicleRepository.get({ plate: "ABCD-1235" })) ||
      (await vehicleRepository.create({
        plate: "ABCD-1235",
        year: 2012,
        metadata: _id,
        owner: users[3]._id,
      }));
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
    user: IUser,
    namespace?: NAMESPACES,
    options: SocketIOClient.ConnectOpts = {},
  ) {
    const { httpServer } = appsNodes[appNodeIndex];
    const { port } = httpServer.address() as AddressInfo;

    namespace =
      namespace || user.roles.includes(UserRoles.DRIVER)
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
    user: IUser | string,
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
    // await Promise.all(appsNodes.map(({ app }) => app.close()));
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
      voyagerSocket.disconnect();
    });

    it("should throw ForbiddenException due to voyager trys access drivers namespace", async () => {
      const [voyager] = users;
      const voyagerSocket = createUserSocket(0, voyager, NAMESPACES.DRIVERS);

      await expect(
        authorizeClient(0, voyagerSocket, voyager1Token),
      ).rejects.toStrictEqual(new Error("Forbidden"));
      voyagerSocket.disconnect();
    });
  });

  describe("Ride workflows", () => {
    async function standardOfferNAccept(overrides?: {
      rideOverride: Partial<IRide>;
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
      const [vehicle] = vehicles;

      const driver1Setup: Setup = mockDriverSetup(String(vehicle._id));

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

      const pickUpPathDecoded: [number, number][] = polyline.decode(
        pickingUpPath.path,
      );

      driverSocket.emit(EVENTS.PICKING_UP_PATH, pickingUpPath);

      driverSocket.emit(EVENTS.START_RIDE, {
        ridePID: ride.pid,
        latLng: pickUpPathDecoded[0],
      });

      await expect(
        fromEventAsync(driverSocket, "exception"),
      ).resolves.toStrictEqual({
        point: "start",
        message: EXCEPTIONS.TOO_DISTANT_OF_EXPECTED,
      });

      const pickingUpVoyagerEvent = await fromEventAsync(
        voyagerSocket,
        EVENTS.PICKING_UP_PATH,
      );

      expect(pickingUpVoyagerEvent).toStrictEqual(pickingUpPath);

      pickUpPathDecoded.forEach((latLng) => {
        const position: Position = {
          latLng,
          heading: 0,
          kmh: 30,
          ignore: [],
          pid: "",
        };
        driverSocket.emit(EVENTS.POSITION, position);
      });

      let positionEventsCount = 0;

      voyagerSocket.on(EVENTS.POSITION, (position: any) => {
        ++positionEventsCount;
      });

      await wait(1000);
      expect(positionEventsCount).toBe(pickUpPathDecoded.length);

      await new Promise((resolve) =>
        driverSocket.emit(
          EVENTS.START_RIDE,
          {
            ridePID: ride.pid,
            latLng: pickUpPathDecoded[pickUpPathDecoded.length - 1],
          },
          resolve,
        ),
      );

      driverSocket.emit(EVENTS.FINISH_RIDE, {
        ridePID: ride.pid,
        latLng: pickUpPathDecoded[0],
      });

      await expect(
        fromEventAsync(driverSocket, "exception"),
      ).resolves.toStrictEqual({
        point: "end",
        message: EXCEPTIONS.TOO_DISTANT_OF_EXPECTED,
      });

      const pathRouteDecoded: [number, number][] = polyline.decode(
        ride.route.path,
      );

      pathRouteDecoded.forEach((latLng) => {
        const position: Position = {
          latLng,
          heading: 0,
          kmh: 30,
          ignore: [],
          pid: "",
        };
        driverSocket.emit(EVENTS.POSITION, position);
      });

      await expect(
        new Promise((resolve) =>
          driverSocket.emit(
            EVENTS.FINISH_RIDE,
            {
              ridePID: ride.pid,
              latLng: pathRouteDecoded[pathRouteDecoded.length - 1],
            },
            resolve,
          ),
        ),
      ).resolves.toBe(true);
      voyagerSocket.disconnect();
      driverSocket.disconnect();
    }, 20000);

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

        voyagerSocket.disconnect();
        driverSocket.disconnect();
      }, 20000);

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

        voyagerSocket.disconnect();
        driverSocket.disconnect();
      }, 20000);

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

        voyagerSocket.disconnect();
        driverSocket.disconnect();
      }, 20000);
    });
  });
});

function mockDriverSetup(vehicleId: string, override: Partial<Setup> = {}) {
  const setup: Setup = {
    vehicleId,
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
