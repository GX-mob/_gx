/**
 * @group unit/gateways/voyagers
 */
import { Server as HttpServer } from "http";
import IOServer, { Server } from "socket.io";
import IOClient from "socket.io-client";
import faker from "faker";
import { VoyagersGateway } from "../voyagers.gateway";
import { RideStatus, RidePayMethods, RideTypes } from "@app/repositories";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import {
  EVENTS,
  Setup,
  Configuration,
  OfferResponse,
  DriverState,
  CANCELATION_RESPONSE,
  OfferRequest,
} from "../../events";
import { CANCELATION } from "../../constants";
import { Position } from "../../events";
import { expectObservableFor, mockSocket, mockRide } from "./util";

describe("VoyagersGateway", () => {
  let gateway: VoyagersGateway;
  let httpServer: HttpServer;
  let ioServer: Server;

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
    createOffer: jest.fn(),
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
    gateway = new VoyagersGateway(
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

  function mockPosition(): Position {
    return {
      latLng: [1, 1],
      heading: 0,
      kmh: 30,
      ignored: [],
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
    });
  });

  describe("offerEventHandler", () => {
    it("should call stateService.createOffer", () => {
      const socketMock = mockSocket();

      const eventBody: OfferRequest = {
        ridePID: faker.random.alphaNumeric(12),
      };

      gateway.offerEventHandler(eventBody, socketMock as any);

      const [createOfferCall] = stateServiceMock.createOffer.mock.calls;

      expect(createOfferCall[0]).toStrictEqual(eventBody);
      expect(createOfferCall[1]).toStrictEqual(socketMock.data);
    });
  });

  describe("amIRunningHandler", () => {
    it("should return current rides", () => {
      const socketMock = mockSocket({
        data: { rides: [mockRide().pid, mockRide().pid] },
      }) as any;

      expect(gateway.amIRunningHandler(socketMock as any)).toStrictEqual(
        socketMock.data.rides,
      );
    });
  });

  describe("cancelRideEventHandler", () => {
    function mockCancelFor(
      acceptTimestamp = Date.now(),
      rideOverride: any = {},
    ) {
      const ride = mockRide(rideOverride);

      const socketMock = mockSocket({
        data: { rides: [ride.pid] },
      });

      ride.voyager = socketMock.data._id;
      ride.driver = faker.random.alphaNumeric(12);

      const driverSocketId = faker.random.alphaNumeric(12);

      rideRepositoryMock.get.mockResolvedValue(ride);
      stateServiceMock.getOfferData.mockResolvedValue({
        driverSocketId,
        acceptTimestamp,
      });

      return {
        ride,
        socketMock,
        driverSocketId,
      };
    }

    function expectCancelFor(
      ackResponse: any,
      socketMock: any,
      ride: any,
      driverSocketId: any,
      status: any,
    ) {
      expect(ackResponse).toStrictEqual({ status });

      const [updateDriverCall] = stateServiceMock.updateDriver.mock.calls;

      expect(updateDriverCall[0]).toBe(socketMock.id);
      expect(updateDriverCall[1]).toStrictEqual({
        state: DriverState.SEARCHING,
      });

      const [rideUpdateCall] = rideRepositoryMock.update.mock.calls;

      expect(rideUpdateCall[0]).toStrictEqual({ pid: ride.pid });
      expect(rideUpdateCall[1]).toStrictEqual({ status: RideStatus.CANCELED });

      const [socketServiceEmitCall] = socketServiceMock.emit.mock.calls;

      expect(socketServiceEmitCall[0]).toBe(driverSocketId);
      expect(socketServiceEmitCall[1]).toBe(EVENTS.CANCELED_RIDE);
      expect(socketServiceEmitCall[2]).toStrictEqual({
        ridePID: ride.pid,
        status,
      });
    }

    it("should handle a safe cancel", async () => {
      const { socketMock, ride, driverSocketId } = mockCancelFor();

      const ackResponse = await gateway.cancelRideEventHandler(
        ride.pid,
        socketMock as any,
      );

      expectCancelFor(
        ackResponse,
        socketMock,
        ride,
        driverSocketId,
        CANCELATION_RESPONSE.SAFE,
      );
    });

    it("should handle no-safe cancel money pay method", async () => {
      const { socketMock, ride, driverSocketId } = mockCancelFor(
        Date.now() - CANCELATION.SAFE_TIME_MS,
      );

      const ackResponse = await gateway.cancelRideEventHandler(
        ride.pid,
        socketMock as any,
      );

      expectCancelFor(
        ackResponse,
        socketMock,
        ride,
        driverSocketId,
        CANCELATION_RESPONSE.PENDENCIE_ISSUED,
      );

      const [pendencieCreateCall] = pendencieRepositoryMock.create.mock.calls;

      expect(pendencieCreateCall[0]).toStrictEqual({
        issuer: ride.voyager,
        affected: ride.driver,
        ride: ride._id,
        amount: CANCELATION.FARE,
      });
    });

    it("should handle no-safe cancel credit pay method", async () => {
      const { socketMock, ride, driverSocketId } = mockCancelFor(
        Date.now() - CANCELATION.SAFE_TIME_MS,
        { payMethod: RidePayMethods.CreditCard },
      );

      const ackResponse = await gateway.cancelRideEventHandler(
        ride.pid,
        socketMock as any,
      );

      expectCancelFor(
        ackResponse,
        socketMock,
        ride,
        driverSocketId,
        CANCELATION_RESPONSE.CHARGE_REQUESTED,
      );
    });
  });
});
