/**
 * @group e2e/run
 */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { startDatabase } from "../../../scripts/setup-dev-database";
import IOClient, { Socket } from "socket.io-client";
import { Server } from "http";
import { parsers } from "extensor";
import { serverEventsSchemas } from "../src/events";
import { SocketAdapter } from "@app/socket";

describe("RunService (e2e)", () => {
  let app: INestApplication;
  let httpServer: Server;
  let socketClient: typeof Socket;

  beforeAll(async () => {
    await startDatabase();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const parser = parsers.schemapack(serverEventsSchemas);

    const redis = {
      pubClient: new (require("ioredis-mock"))(),
      subClient: new (require("ioredis-mock"))(),
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

    await app.init();
    await app.listen(0);

    httpServer = app.getHttpServer();

    const httpServerAddr = httpServer.address() as any;

    console.log("@", httpServerAddr);

    /*IOClient("ws://localhost:" + httpServerAddr.port, {
      autoConnect: false,
    });*/
  });

  it("sei la", () => {
    console.log(httpServer.address());
    return console.log(app.getHttpServer());
  });
});
