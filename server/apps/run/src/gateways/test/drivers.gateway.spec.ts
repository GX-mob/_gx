/**
 * @group unit/gateways/drivers
 */
import { Server as HttpServer } from "http";
import IOServer, { Server } from "socket.io";
import IOClient from "socket.io-client";
import faker from "faker";
import { DriversGateway } from "../drivers.gateway";
import { RidePayMethods, RideTypes } from "@shared/interfaces";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import {
  EVENTS,
  Setup,
  Position,
  Configuration,
  OfferResponse,
  DriverState,
  CANCELATION_RESPONSE,
} from "@shared/events";
import { CANCELATION } from "../../constants";
import { expectObservableFor, mockSocket, mockRide } from "./util";
import ms from "ms";

describe("DriversGateway", () => {
  let gateway: DriversGateway;
  let httpServer: HttpServer;
  let ioServer: Server;

  let configServiceMock;

  const socketServiceMock = {
    emit: jest.fn(),
  };
  const rideRepositoryMock = {
    get: jest.fn(),
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
    positionEvent: jest.fn(),
    setupDriverEvent: jest.fn(),
    setConfigurationEvent: jest.fn(),
    offerResponseEvent: jest.fn(),
    getOfferData: jest.fn(),
    updateDriver: jest.fn(),
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
    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        const configMock: any = {
          "OFFER.SAFE_CANCELATION_WINDOW": ms("3 minutes"),
        };
        return configMock[key];
      }),
    };

    gateway = new DriversGateway(
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

  function mockPosition(): Position {
    return {
      latLng: [1, 1],
      heading: 0,
      kmh: 30,
      ignore: [],
      pid: "",
    };
  }

  describe("positionEventHandler", () => {
    it("should dispatch and set position in list", () => {
      const socketMock = mockSocket();
      const eventBody = mockPosition();

      gateway.positionEventHandler(eventBody as any, socketMock as any);

      expectObservableFor(
        socketMock,
        EVENTS.POSITION,
        eventBody,
        socketServiceMock,
      );

      const [statePositionCall] = stateServiceMock.positionEvent.mock.calls;

      expect(statePositionCall[0]).toBe(socketMock.id);
      expect(statePositionCall[1]).toBe(eventBody);
    });
  });

  describe("setupEventHandler", () => {
    it("should call stateService.setupDriverEvent", () => {
      const socketMock = mockSocket();

      const eventBody: Setup = {
        position: mockPosition(),
        vehicleId: faker.random.alphaNumeric(12),
        config: {
          payMethods: [RidePayMethods.Money],
          types: [RideTypes.Normal],
          drops: ["any"],
        },
      };

      gateway.setupEventHandler(eventBody, socketMock as any);

      const [setupDriverCall] = stateServiceMock.setupDriverEvent.mock.calls;

      expect(setupDriverCall[0]).toBe(socketMock.id);
      expect(setupDriverCall[1]).toStrictEqual(eventBody);
      expect(setupDriverCall[2]).toStrictEqual(socketMock.data);
    });
  });

  describe("configurationEventHandler", () => {
    it("should call stateService.setConfigurationEvent", () => {
      const socketMock = mockSocket();

      const eventBody: Configuration = {
        payMethods: [RidePayMethods.Money],
        types: [RideTypes.Normal],
        drops: ["any"],
      };

      gateway.configurationEventHandler(eventBody, socketMock as any);

      const [
        setConfigurationCall,
      ] = stateServiceMock.setConfigurationEvent.mock.calls;

      expect(setConfigurationCall[0]).toBe(socketMock.id);
      expect(setConfigurationCall[1]).toStrictEqual(eventBody);
    });
  });

  describe("offerResponseEventHandler", () => {
    it("should call stateService.offerResponseEvent", () => {
      const socketMock = mockSocket();

      const eventBody: OfferResponse = {
        ridePID: faker.random.alphaNumeric(12),
        response: true,
      };

      gateway.offerResponseEventHandler(eventBody, socketMock as any);

      const [
        offerResponseCall,
      ] = stateServiceMock.offerResponseEvent.mock.calls;

      expect(offerResponseCall[0]).toBe(socketMock.id);
      expect(offerResponseCall[1]).toStrictEqual(eventBody);
      expect(offerResponseCall[2]).toStrictEqual(socketMock.data);
    });
  });

  describe("cancelRideEventHandler", () => {
    it("should handle a safe cancel", async () => {
      const socketMock = mockSocket();
      const ride = mockRide({
        driver: { _id: socketMock.data._id },
      });
      const requesterSocketId = faker.random.alphaNumeric(12);
      const acceptTimestamp = Date.now();

      rideRepositoryMock.get.mockResolvedValue(ride);
      stateServiceMock.getOfferData.mockResolvedValue({
        requesterSocketId,
        acceptTimestamp,
      });

      const ackResponse = await gateway.cancelRideEventHandler(
        ride.pid,
        socketMock as any,
      );

      expect(ackResponse).toStrictEqual({ status: CANCELATION_RESPONSE.SAFE });

      const [updateDriverCall] = stateServiceMock.updateDriver.mock.calls;

      expect(updateDriverCall[0]).toBe(socketMock.id);
      expect(updateDriverCall[1]).toStrictEqual({
        state: DriverState.SEARCHING,
      });

      const [rideUpdateCall] = rideRepositoryMock.update.mock.calls;

      expect(rideUpdateCall[0]).toStrictEqual({ pid: ride.pid });
      expect(rideUpdateCall[1]).toStrictEqual({ driver: null });

      const [socketServiceEmitCall] = socketServiceMock.emit.mock.calls;

      expect(socketServiceEmitCall[0]).toBe(requesterSocketId);
      expect(socketServiceEmitCall[1]).toBe(EVENTS.CANCELED_RIDE);
      expect(socketServiceEmitCall[2]).toStrictEqual({
        ridePID: ride.pid,
        status: CANCELATION_RESPONSE.SAFE,
      });

      expect(pendencieRepositoryMock.create).toBeCalledTimes(0);
    });

    it("should handle a no-safe cancel", async () => {
      const socketMock = mockSocket();
      const ride = mockRide({
        driver: { _id: socketMock.data._id },
      });
      const requesterSocketId = faker.random.alphaNumeric(12);
      const acceptTimestamp = Date.now() - CANCELATION.SAFE_TIME_MS;

      rideRepositoryMock.get.mockResolvedValue(ride);
      stateServiceMock.getOfferData.mockResolvedValue({
        requesterSocketId,
        acceptTimestamp,
      });

      const ackResponse = await gateway.cancelRideEventHandler(
        ride.pid,
        socketMock as any,
      );

      expect(ackResponse).toStrictEqual({
        status: CANCELATION_RESPONSE.PENDENCIE_ISSUED,
      });

      const [updateDriverCall] = stateServiceMock.updateDriver.mock.calls;

      expect(updateDriverCall[0]).toBe(socketMock.id);
      expect(updateDriverCall[1]).toStrictEqual({
        state: DriverState.SEARCHING,
      });

      const [rideUpdateCall] = rideRepositoryMock.update.mock.calls;

      expect(rideUpdateCall[0]).toStrictEqual({ pid: ride.pid });
      expect(rideUpdateCall[1]).toStrictEqual({ driver: null });

      const [socketServiceEmitCall] = socketServiceMock.emit.mock.calls;

      expect(socketServiceEmitCall[0]).toBe(requesterSocketId);
      expect(socketServiceEmitCall[1]).toBe(EVENTS.CANCELED_RIDE);
      expect(socketServiceEmitCall[2]).toStrictEqual({
        ridePID: ride.pid,
        status: CANCELATION_RESPONSE.PENDENCIE_ISSUED,
      });

      const [pendencieCreateCall] = pendencieRepositoryMock.create.mock.calls;

      expect(pendencieCreateCall[0]).toStrictEqual({
        issuer: ride.driver,
        affected: ride.voyager,
        ride: ride._id,
        amount: CANCELATION.FARE,
      });
    });
  });
});
