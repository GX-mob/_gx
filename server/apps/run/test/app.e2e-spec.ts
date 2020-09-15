/**
 * @group e2e/run
 */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import { AppModule } from "../src/app.module";
import IOClient, { Socket } from "socket.io-client";
import IORedis from "ioredis";
import { Server } from "http";
import { parsers, auth } from "extensor";
import { EVENTS, serverEventsSchemas, Position } from "../src/events";
import { NAMESPACES } from "../src/constants";
import { SocketAdapter, SocketModule, SocketService } from "@app/socket";
import {
  RepositoryModule,
  RepositoryService,
  User,
  USERS_ROLES,
} from "@app/repositories";
import { combineLatest, from, fromEvent } from "rxjs";
import faker from "faker";
//import { startDatabase } from "scripts/setup-dev-database";
import { SessionModule, SessionService } from "@app/session";
import { StateService } from "../src/state.service";
import { ConfigModule } from "@nestjs/config";
import { MATCH, OFFER } from "../src/configuration/state.config";
import { GatewaysModule } from "../src/gateways/gateways.module";
import { CacheModule } from "@app/cache";

describe("RunService (e2e)", () => {
  const parser = parsers.schemapack(serverEventsSchemas);

  let httpServerNode1: Server;
  let httpServerNode2: Server;
  let appNode1: INestApplication;
  let appNode2: INestApplication;

  let voyagerClient: typeof Socket; // connects to node 1
  let driverClient: typeof Socket; // connects to node 2

  const sessionService = {
    verify: jest.fn(),
    hasPermission: jest.fn(),
  };

  let stateService1: StateService;
  let stateService2: StateService;

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
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".development.env",
          load: [MATCH, OFFER],
        }),
        LoggerModule.forRoot({
          pinoHttp: { prettyPrint: process.env.NODE_ENV !== "production" },
        }),
        CacheModule,
        RepositoryModule,
        SessionModule,
        GatewaysModule,
      ],
    })
      .overrideProvider(PinoLogger)
      .useValue({
        setContext: () => {},
        error: () => {},
        info: () => {},
        warn: () => {},
      })
      .overrideProvider(RepositoryService)
      .useValue({})
      .overrideProvider(SessionService)
      .useValue(sessionService)
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
        broadcastedEvents: [
          "setup",
          "position",
          "offerResponse",
          "configuration",
        ],
      }),
    );

    await appNode.init();

    return appNode;
  }

  beforeEach(async () => {
    appNode1 = await mockNodeApplication();
    appNode2 = await mockNodeApplication();

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

    driverClient = IOClient(
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
    driverClient.close();
    await appNode1.close();
    await appNode2.close();
  });

  describe("Authorizations", () => {
    it("should connect", (done) => {
      const voyagerMock = mockUser();
      const driverMock = mockUser({
        roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
      });
      const voyagerToken = "voyagerToken";
      const driverToken = "driverToken";

      sessionService.verify.mockImplementation((token) => {
        return ({
          [voyagerToken]: { user: voyagerMock },
          [driverToken]: { user: driverMock },
        } as any)[token];
      });

      sessionService.hasPermission.mockReturnValue(true);

      const voyagerConnect = fromEvent(voyagerClient, "connect");
      const driverConnect = fromEvent(driverClient, "connect");

      combineLatest([voyagerConnect, driverConnect]).subscribe(() => {
        const voyagerAuth = from(
          auth.client(voyagerClient, { token: voyagerToken }).catch(() => {}),
        );
        const driverAuth = from(
          auth.client(driverClient, { token: driverToken }).catch(() => {}),
        );

        combineLatest([voyagerAuth, driverAuth]).subscribe(() => {
          expect(voyagerClient.connected).toBeTruthy();
          expect(driverClient.connected).toBeTruthy();
          done();
        });
      });

      voyagerClient.connect();
      driverClient.connect();
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
    it("should dispatch", async (done) => {
      const voyagerMock = mockUser();
      const driverMock = mockUser({
        roles: [USERS_ROLES.VOYAGER, USERS_ROLES.DRIVER],
      });
      const voyagerToken = "voyagerToken";
      const driverToken = "driverToken";

      sessionService.verify.mockImplementation((token) => {
        return ({
          [voyagerToken]: { user: voyagerMock },
          [driverToken]: { user: driverMock },
        } as any)[token];
      });

      // Voyager node call
      jest.spyOn(stateService1, "setConnectionData").mockImplementation(
        async () =>
          ({
            pid: voyagerMock.pid,
            observers: [{ socketId: driverClient.id, p2p: false }],
          } as any),
      );

      // Driver node call
      jest.spyOn(stateService2, "setConnectionData").mockImplementation(
        async () =>
          ({
            pid: driverMock.pid,
            observers: [{ socketId: voyagerClient.id, p2p: false }],
          } as any),
      );

      sessionService.hasPermission.mockReturnValue(true);

      const voyagerConnect = fromEvent(voyagerClient, "connect");
      const driverConnect = fromEvent(driverClient, "connect");

      voyagerClient.connect();
      driverClient.connect();

      await new Promise((resolve) =>
        combineLatest([voyagerConnect, driverConnect]).subscribe(resolve),
      );

      const voyagerAuth = from(
        auth.client(voyagerClient, { token: voyagerToken }).catch(() => {}),
      );
      const driverAuth = from(
        auth.client(driverClient, { token: driverToken }).catch(() => {}),
      );

      await new Promise((resolve) =>
        combineLatest([voyagerAuth, driverAuth]).subscribe(resolve),
      );

      const positionBody: Position = {
        latLng: [1, 1],
        heading: 0,
        kmh: 30,
        ignore: [],
        pid: "foo",
      };

      driverClient.emit(EVENTS.POSITION, positionBody);

      fromEvent(voyagerClient, EVENTS.POSITION).subscribe((position) => {
        expect(position).toStrictEqual({
          ...positionBody,
          pid: driverMock.pid,
        });

        done();
      });
    });
    //it("should ignore p2p connected users", () => {});
  });
});
