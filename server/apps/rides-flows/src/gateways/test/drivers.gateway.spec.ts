/**
 * @group unit/rides-flows
 * @group unit/rides-flows/gateways
 * @group unit/rides-flows/gateways/drivers
 */
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
      expect(stateServiceMock.positionEvent).toBeCalledWith(
        socketMock.id,
        eventBody,
      );
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

      expect(stateServiceMock.setupDriverEvent).toBeCalledWith(
        socketMock.id,
        eventBody,
        socketMock.data,
      );
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

      expect(stateServiceMock.setConfigurationEvent).toBeCalledWith(
        socketMock.id,
        eventBody,
      );
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

      expect(stateServiceMock.offerResponseEvent).toBeCalledWith(
        socketMock.id,
        eventBody,
        socketMock.data,
      );
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
      expect(stateServiceMock.updateDriver).toBeCalledWith(socketMock.id, {
        state: DriverState.SEARCHING,
      });
      expect(rideRepositoryMock.update).toBeCalledWith(
        { pid: ride.pid },
        { driver: undefined },
      );
      expect(socketServiceMock.emit).toBeCalledWith(
        requesterSocketId,
        EVENTS.CANCELED_RIDE,
        {
          ridePID: ride.pid,
          status: CANCELATION_RESPONSE.SAFE,
        },
      );
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
      expect(stateServiceMock.updateDriver).toBeCalledWith(socketMock.id, {
        state: DriverState.SEARCHING,
      });
      expect(rideRepositoryMock.update).toBeCalledWith(
        { pid: ride.pid },
        { driver: undefined },
      );
      expect(socketServiceMock.emit).toBeCalledWith(
        requesterSocketId,
        EVENTS.CANCELED_RIDE,
        {
          ridePID: ride.pid,
          status: CANCELATION_RESPONSE.PENDENCIE_ISSUED,
        },
      );
      expect(pendencieRepositoryMock.create).toBeCalledWith({
        issuer: ride.driver,
        affected: ride.voyager,
        ride: ride._id,
        amount: CANCELATION.FARE,
      });
    });
  });
});
