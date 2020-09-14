/**
 * @group unit/gateways/common
 */
import { Server as HttpServer } from "http";
import IOServer, { Server } from "socket.io";
import IOClient from "socket.io-client";
import faker from "faker";
import { auth } from "extensor";
import { Common } from "./common";
import { USERS_ROLES, RideStatus } from "@app/repositories";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import { EVENTS } from "../events";
import { CANCELATION } from "../constants";
import {
  RideNotFoundException,
  UncancelableRideException,
} from "../exceptions";

describe("CommonsGateway", () => {
  let common: Common;
  let httpServer: HttpServer;
  let ioServer: Server;

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
    common = new Common(
      socketServiceMock as any,
      rideRepositoryMock as any,
      pendencieRepositoryMock as any,
      sessionServiceMock as any,
      stateServiceMock as any,
      cacheServiceMock as any,
    );
  });

  afterEach((done) => {
    jest.resetAllMocks();

    if (ioServer) return ioServer.close(done);
    done();
  });

  describe("observables", () => {
    function mockSocket(override: any = {}) {
      return {
        state: 0,
        data: {
          pid: faker.random.alphaNumeric(12),
          observers: [
            {
              socketId: faker.random.alphaNumeric(12),
              p2p: false,
            },
            {
              socketId: faker.random.alphaNumeric(12),
              p2p: true,
            },
          ],
        },
        ...override,
      };
    }

    function expectObservableFor(socketMock: any, event: EVENTS) {
      socketMock.data.observers.forEach((observer: any, index: number) => {
        const emitCall = socketServiceMock.emit.mock.calls[index];

        if (observer.p2p) {
          return expect(emitCall).toBeUndefined();
        }

        expect(emitCall[0]).toBe(observer.socketId);
        expect(emitCall[1]).toBe(event);
        expect(emitCall[2]).toMatchObject({
          state: 1,
          pid: socketMock.data.pid,
        });
      });
    }

    it("stateEventHandler", () => {
      const socketMock = mockSocket();

      common.stateEventHandler({ state: 1 } as any, socketMock as any);
      expect(socketMock.state).toBe(1);

      expectObservableFor(socketMock, EVENTS.STATE);
    });

    it("positionEventHandler", () => {
      const socketMock = mockSocket();

      common.positionEventHandler({ state: 1 } as any, socketMock as any);

      expectObservableFor(socketMock, EVENTS.POSITION);
    });
  });

  describe("updateRide", () => {
    it("should set a update", () => {
      const _id = faker.random.alphaNumeric(12);

      const updateQuery = { _id };
      const updateData = { status: RideStatus.CANCELED };

      common.updateRide(updateQuery, updateData);

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

      common.createPendencie({ ride, issuer, affected });

      const [repositoryCall] = pendencieRepositoryMock.create.mock.calls;

      expect(repositoryCall[0]).toStrictEqual({
        ride: ride._id,
        issuer,
        affected,
        amount: CANCELATION.FARE,
      });
    });
  });

  describe("cancelationSecutiryChecks", () => {
    it("should throw RideNotFoundException", () => {
      expect(() =>
        common.cancelationSecutiryChecks(null, "", "voyager"),
      ).toThrow(new RideNotFoundException());
    });

    it("should throw UncancelableRideException: running", () => {
      const ride = {
        pid: faker.random.alphaNumeric(12),
        status: RideStatus.RUNNING,
      };

      expect(() =>
        common.cancelationSecutiryChecks(ride as any, "", "voyager"),
      ).toThrow(new UncancelableRideException(ride.pid, "running"));
    });

    it("should throw UncancelableRideException: not-in-ride for voyager", () => {
      const random = faker.random.alphaNumeric(12);
      const ride = {
        pid: faker.random.alphaNumeric(12),
        status: RideStatus.RUNNING,
        voyager: faker.random.alphaNumeric(12),
      };

      expect(() =>
        common.cancelationSecutiryChecks(ride as any, random, "voyager"),
      ).toThrow(new UncancelableRideException(ride.pid, "running"));
    });

    it("should throw UncancelableRideException: not-in-ride for driver", () => {
      const random = faker.random.alphaNumeric(12);
      const ride = {
        pid: faker.random.alphaNumeric(12),
        status: RideStatus.CREATED,
        driver: faker.random.alphaNumeric(12),
      };

      expect(() =>
        common.cancelationSecutiryChecks(ride as any, random, "driver"),
      ).toThrow(new UncancelableRideException(ride.pid, "not-in-ride"));
    });
  });
});
