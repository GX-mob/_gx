/**
 * @group e2e/run
 */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppModule } from "../src/app.module";
import IOClient, { Socket } from "socket.io-client";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import { Server } from "http";
import { parsers, auth } from "extensor";
import { serverEventsSchemas } from "../src/events";
import { NAMESPACES } from "../src/constants";
import { SocketAdapter } from "@app/socket";
import { RepositoryService, User, USERS_ROLES } from "@app/repositories";
import { combineLatest, from, fromEvent } from "rxjs";
import faker from "faker";
//import { startDatabase } from "scripts/setup-dev-database";
import { SessionService } from "@app/session";

describe("RunService (e2e)", () => {
  const parser = parsers.schemapack(serverEventsSchemas);

  const redis = {
    pubClient: new IORedisMock(),
    subClient: new IORedisMock(),
  };

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

  const stateService = {
    setConnectionData: jest.fn(),
  };

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

    return appNode;
  }

  beforeEach(async () => {
    appNode1 = await mockNodeApplication();
    appNode2 = await mockNodeApplication();

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
    await appNode1.close();
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

  describe("Observables dispatchs", () => {
    it("should dispatch", () => {});
    it("should ignore p2p connected users", () => {});
  });
});
