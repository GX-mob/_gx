/**
 * @group unit/gateways/common
 */
import { Server as HttpServer } from "http";
import IOServer, { Server } from "socket.io";
import IOClient from "socket.io-client";
import faker from "faker";
import { Common } from "../common";
import { RideStatus } from "@app/repositories";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import { EVENTS } from "../../events";
import { CANCELATION } from "../../constants";
import {
  RideNotFoundException,
  UncancelableRideException,
} from "../../exceptions";
import { mockSocket, expectObservableFor } from "./util";

describe("CommonsGateway", () => {
  let gateway: Common;
  let httpServer: HttpServer;
  let ioServer: Server;

  const configServiceMock = {
    get: jest.fn(),
  };
  const socketServiceMock = {
    emit: jest.fn(),
  };
  const rideRepositoryMock = {
    update: jest.fn(),
  };
  const pendencieRepositoryMock = {
    create: jest.fn(),
  };
  const sessionServiceMock = {
    verify: jest.fn(),
    hasPermission: jest.fn(),
  };
  const stateServiceMock = {
    setConnectionData: jest.fn(),
  };
  const cacheServiceMock = {
    redis: new IORedisMock(),
  };

  function mockServer() {
    httpServer = new HttpServer();
    ioServer = IOServer(httpServer);

    return {
      async listen() {
        await new Promise((resolve) => httpServer.listen(resolve));

        const httpServerAddr = httpServer.address() as any;

        const clientSocket = IOClient("ws://localhost:" + httpServerAddr.port, {
          autoConnect: false,
        });

        return clientSocket;
      },
    };
  }

  beforeEach(() => {
    gateway = new Common(
      configServiceMock as any,
      socketServiceMock as any,
      rideRepositoryMock as any,
      pendencieRepositoryMock as any,
      sessionServiceMock as any,
      stateServiceMock as any,
      cacheServiceMock as any,
      { setContext: () => {}, error: () => {}, info: () => {} } as any,
    );
  });

  afterEach((done) => {
    jest.resetAllMocks();

    if (ioServer) return ioServer.close(done);
    done();
  });

  describe("observables", () => {
    it("stateEventHandler", () => {
      const socketMock = mockSocket();
      const eventBody = { state: 1 };

      gateway.stateEventHandler(eventBody as any, socketMock as any);
      expect(socketMock.state).toBe(1);

      expectObservableFor(
        socketMock,
        EVENTS.STATE,
        eventBody,
        socketServiceMock,
      );
    });

    it("positionEventHandler", () => {
      const socketMock = mockSocket();
      const eventBody = {
        latLng: [1, 1],
        heading: 0,
        kmh: 30,
        ignored: [],
        pid: "",
      };

      gateway.positionEventHandler(eventBody as any, socketMock as any);

      expectObservableFor(
        socketMock,
        EVENTS.POSITION,
        eventBody,
        socketServiceMock,
      );
    });
  });

  describe("updateRide", () => {
    it("should set a update", () => {
      const _id = faker.random.alphaNumeric(12);

      const updateQuery = { _id };
      const updateData = { status: RideStatus.CANCELED };

      gateway.updateRide(updateQuery, updateData);

      const [repositoryCall] = rideRepositoryMock.update.mock.calls;

      expect(repositoryCall[0]).toStrictEqual(updateQuery);
      expect(repositoryCall[1]).toStrictEqual(updateData);
    });
  });
  describe("createPendencie", () => {
    it("should set a create", () => {
      const ride = { _id: faker.random.alphaNumeric(12) } as any;

      const issuer = faker.random.alphaNumeric(12);
      const affected = faker.random.alphaNumeric(12);

      gateway.createPendencie({ ride: ride._id, issuer, affected });

      const [repositoryCall] = pendencieRepositoryMock.create.mock.calls;

      expect(repositoryCall[0]).toStrictEqual({
        ride: ride._id,
        issuer,
        affected,
        amount: CANCELATION.FARE,
      });
    });
  });
});
