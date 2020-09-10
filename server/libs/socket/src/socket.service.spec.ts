/**
 * Data Service
 *
 * @group unit/services/socket
 */
import { spawn } from "child_process";
import { Test, TestingModule } from "@nestjs/testing";
import { Server as HttpServer } from "http";
import IOServer, { Server } from "socket.io";
import IOClient, { Socket } from "socket.io-client";
import IORedis from "ioredis";
import { parsers } from "extensor";
import { SocketService } from "./socket.service";
import faker from "faker";

const wait = (ts: number) => new Promise((resolve) => setTimeout(resolve, ts));

describe("SocketService", () => {
  let httpServer1: HttpServer;
  let httpServer2: HttpServer;
  let httpServer3: HttpServer;
  let serviceServer1: SocketService;
  let serviceServer2: SocketService;
  let serviceServer3: SocketService;
  let ioServer1: Server;
  let ioServer2: Server;
  let ioServer3: Server;
  let clientSocket1: typeof Socket;
  let clientSocket2: typeof Socket;
  let clientSocket3: typeof Socket;

  let redisInstanceIp: string;

  const broadcastedEvents = ["position", "state"];

  async function mockServer() {
    httpServer1 = new HttpServer();
    httpServer2 = new HttpServer();
    httpServer3 = new HttpServer();

    ioServer1 = IOServer(httpServer1);
    ioServer2 = IOServer(httpServer2);
    ioServer3 = IOServer(httpServer3);

    const redisHost = process.env.REDIS_HOST || "127.0.0.1";

    const redis1 = {
      pubClient: new IORedis(redisHost),
      subClient: new IORedis(redisHost),
    };

    const redis2 = {
      pubClient: new IORedis(redisHost),
      subClient: new IORedis(redisHost),
    };

    const redis3 = {
      pubClient: new IORedis(redisHost),
      subClient: new IORedis(redisHost),
    };

    const parser = parsers.schemapack({});

    serviceServer1.nodeId = "server1";
    serviceServer2.nodeId = "server2";
    serviceServer3.nodeId = "server3";

    serviceServer1.configureServer(ioServer1, {
      broadcastedEvents,
      redis: redis1,
      parser,
    });

    serviceServer2.configureServer(ioServer2, {
      broadcastedEvents,
      redis: redis2,
      parser,
    });

    serviceServer3.configureServer(ioServer3, {
      broadcastedEvents,
      redis: redis3,
      parser,
    });

    return {
      listen() {
        return new Promise(async (resolve, reject) => {
          await new Promise((resolve) => httpServer1.listen(resolve));
          await new Promise((resolve) => httpServer2.listen(resolve));
          await new Promise((resolve) => httpServer3.listen(resolve));

          const httpServer1Addr = httpServer1.address() as any;
          const httpServer2Addr = httpServer2.address() as any;
          const httpServer3Addr = httpServer3.address() as any;

          clientSocket1 = IOClient("ws://localhost:" + httpServer1Addr.port);
          clientSocket2 = IOClient("ws://localhost:" + httpServer2Addr.port);
          clientSocket3 = IOClient("ws://localhost:" + httpServer3Addr.port);

          resolve();
        });
      },
      async cleanUp(done: any) {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
        clientSocket3.disconnect();

        ioServer1.close();
        ioServer2.close();
        ioServer3.close();

        await Promise.all([
          redis1.pubClient.quit(),
          redis1.subClient.quit(),
          redis2.pubClient.quit(),
          redis2.subClient.quit(),
          redis3.pubClient.quit(),
          redis3.subClient.quit(),
        ]);

        done();
      },
    };
  }

  beforeEach(async () => {
    const module1: TestingModule = await Test.createTestingModule({
      providers: [SocketService],
    }).compile();

    const module2: TestingModule = await Test.createTestingModule({
      providers: [SocketService],
    }).compile();

    const module3: TestingModule = await Test.createTestingModule({
      providers: [SocketService],
    }).compile();

    serviceServer1 = module1.get<SocketService>(SocketService);
    serviceServer2 = module2.get<SocketService>(SocketService);
    serviceServer3 = module3.get<SocketService>(SocketService);
  });

  it("should be defined", () => {
    expect(serviceServer1).toBeDefined();
    expect(serviceServer2).toBeDefined();
  });

  describe("Nodes events", () => {
    it("should transmit events", async (done) => {
      const { listen, cleanUp } = await mockServer();
      await listen();

      const event = "foo";
      const eventData1 = { foo: "bar" };
      const eventData2 = { bar: "foo" };

      serviceServer1.nodes.on(event, (data) => {
        expect(data).toStrictEqual(eventData2);
      });

      serviceServer2.nodes.on(event, (data) => {
        expect(data).toStrictEqual(eventData1);
      });

      serviceServer1.nodes.emit(event, eventData1);
      serviceServer2.nodes.emit(event, eventData2);

      await wait(1000);
      cleanUp(done);
    });
  });

  describe("broadcasted events", () => {
    it("should broadcast events to other server nodes", async (done) => {
      const { listen, cleanUp } = await mockServer();
      const data1 = { foo: "bar" };
      const data2 = { bar: "foo" };

      // Server 1
      // should receive broadcasted from Server 2
      serviceServer1.on(broadcastedEvents[0], (content) => {
        expect(content.socketId).toBe(clientSocket2.id);
        expect(content.data).toStrictEqual(data2);
      });

      // Server 2
      // should receive broadcasted from Server 1
      serviceServer2.on(broadcastedEvents[0], (content) => {
        expect(content.socketId).toBe(clientSocket1.id);
        expect(content.data).toStrictEqual(data1);
      });

      await listen();

      // Client connected to Server 1
      clientSocket1.on("connect", () => {
        clientSocket1.emit(broadcastedEvents[0], data1);
      });

      // Client connected to Server 2
      clientSocket2.on("connect", () => {
        clientSocket2.emit(broadcastedEvents[0], data2);
      });

      await wait(1000);
      cleanUp(done);
    });
  });

  describe("Emit event to socket", () => {
    it("should send an event to local connection", async (done) => {
      const { listen, cleanUp } = await mockServer();
      const data = Date.now();

      ioServer1.on("connection", (socket) => {
        setTimeout(
          () => serviceServer1.emit(clientSocket1.id, "nice", data),
          100,
        );
      });

      await listen();

      clientSocket1.on("connect", () => {
        clientSocket1.on("nice", (received: string) => {
          expect(received).toBe(data);
          cleanUp(done);
        });
      });
    });

    it("should send an event to a socket that does not have its connection", async (done) => {
      const { listen, cleanUp } = await mockServer();
      const data = Date.now();

      ioServer1.on("connection", (socket) => {
        setTimeout(
          () => serviceServer1.emit(clientSocket2.id, "nice", data),
          100,
        );
      });

      await listen();

      clientSocket2.on("connect", () => {
        clientSocket2.on("nice", (received: string) => {
          expect(received).toBe(data);
          cleanUp(done);
        });
      });
    });

    it("should receive acknownledgment from another server socket node", async (done) => {
      const { listen, cleanUp } = await mockServer();
      const data = Date.now();
      const ackData = Date.now();

      ioServer1.on("connection", (socket) => {
        setTimeout(
          () =>
            serviceServer1.emit(clientSocket2.id, "nice", data, (data) => {
              expect(data).toBe(ackData);
              cleanUp(done);
            }),
          100,
        );
      });

      await listen();

      clientSocket2.on("connect", () => {
        clientSocket2.on("nice", (received: string, ack: any) => {
          expect(received).toBe(data);
          ack(ackData);
        });
      });
    });

    it("should get acknownledgment timeout from another server socket node", async (done) => {
      const { listen, cleanUp } = await mockServer();
      const data = Date.now();

      ioServer1.on("connection", (socket) => {
        setTimeout(
          () =>
            serviceServer1.emit(clientSocket2.id, "nice", data, (data) => {
              expect(data).toBe("ackTimeout");
              cleanUp(done);
            }),
          100,
        );
      });

      await listen();

      clientSocket2.on("connect", () => {
        clientSocket2.on("nice", (received: string, ack: any) => {
          expect(received).toBe(data);
          //ack(ackData);
        });
      });
    });
  });
});
