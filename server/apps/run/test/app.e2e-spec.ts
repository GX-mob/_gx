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
import { parsers } from "extensor";
import { serverEventsSchemas } from "../src/events";
import { NAMESPACES } from "../src/constants";
import { SocketAdapter } from "@app/socket";
import { RepositoryService } from "@app/repositories";
import { combineLatest, fromEvent } from "rxjs";

describe("RunService (e2e)", () => {
  let app: INestApplication;
  let httpServer: Server;
  let voyagerClient: typeof Socket;
  let driverClient: typeof Socket;

  beforeAll(async () => {
    //await startDatabase(false);
  });

  beforeEach(async () => {
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
      .compile();

    app = moduleFixture.createNestApplication();

    const parser = parsers.schemapack(serverEventsSchemas);

    const redis = {
      pubClient: new IORedisMock(),
      subClient: new IORedisMock(),
    };

    app.useWebSocketAdapter(
      new SocketAdapter(app, {
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

    await app.listen(0);

    httpServer = app.getHttpServer();

    const httpServerAddr = httpServer.address() as any;

    voyagerClient = IOClient(
      `ws://localhost:${httpServerAddr.port}${NAMESPACES.VOYAGERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );

    driverClient = IOClient(
      `ws://localhost:${httpServerAddr.port}${NAMESPACES.VOYAGERS}`,
      {
        autoConnect: false,
        parser: parser.parser,
      } as any,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it("should connect", (done) => {
    const voyagerConnect = fromEvent(voyagerClient, "connect");
    const driverConnect = fromEvent(driverClient, "connect");

    combineLatest([voyagerConnect, driverConnect]).subscribe((_) => {
      done();
    });

    voyagerClient.connect();
    driverClient.connect();

    //voyagerClient.on("connect", done);
  });
});
