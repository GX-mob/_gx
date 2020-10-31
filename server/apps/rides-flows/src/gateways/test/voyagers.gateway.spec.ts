/**
 * @group unit/rides-flows
 * @group unit/rides-flows/gateways
 * @group unit/rides-flows/gateways/voyagers
 */
import faker from "faker";
import { VoyagersGateway } from "../voyagers.gateway";
import { RideStatus, RidePayMethods } from "@shared/interfaces";
//@ts-ignore
import IORedisMock from "ioredis-mock";
import {
  EVENTS,
  Position,
  DriverState,
  CANCELATION_RESPONSE,
  OfferRequest,
} from "@shared/events";
import { CANCELATION } from "../../constants";
import { expectObservableFor, mockSocket, mockRide } from "./util";
import ms from "ms";

describe("VoyagersGateway", () => {
  let gateway: VoyagersGateway;
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
    createOffer: jest.fn(),
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
    gateway = new VoyagersGateway(
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
    });
  });

  describe("offerEventHandler", () => {
    it("should call stateService.createOffer", () => {
      const socketMock = mockSocket();
      const eventBody: OfferRequest = {
        ridePID: faker.random.alphaNumeric(12),
      };

      gateway.offerEventHandler(eventBody, socketMock as any);

      expect(stateServiceMock.createOffer).toBeCalledWith(
        eventBody,
        socketMock,
      );
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

      ride.voyager = { _id: socketMock.data._id };
      ride.driver = { _id: faker.random.alphaNumeric(12) };

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
      expect(stateServiceMock.updateDriver).toBeCalledWith(socketMock.id, {
        state: DriverState.SEARCHING,
      });
      expect(rideRepositoryMock.update).toBeCalledWith(
        { pid: ride.pid },
        { status: RideStatus.CANCELED },
      );
      expect(socketServiceMock.emit).toBeCalledWith(
        driverSocketId,
        EVENTS.CANCELED_RIDE,
        { ridePID: ride.pid, status },
      );
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

      expect(pendencieRepositoryMock.create).toBeCalledWith({
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
