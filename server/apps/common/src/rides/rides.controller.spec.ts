/**
 * Data Service
 *
 * @group unit/controllers/rides
 */
import { RidesController } from "./rides.controller";
import { RidesService } from "./rides.service";
import { EventEmitter } from "events";
import {
  Price,
  RidePayMethods,
  RideTypes,
  TRoutePoint,
} from "@app/repositories";
import { GetRidesPricesParams, CreateRideDto } from "./rides.dto";
import { prices, path } from "./__mocks__";
import shortid from "shortid";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";

describe("RidesController", () => {
  let rideService: RidesService;
  let controller: RidesController;
  const emitter = new EventEmitter();

  emitter.setMaxListeners(50);

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const repositoryServiceMock = {
    pendencieModel: {
      find: jest.fn(),
    },
    priceModel: {
      find: () => ({
        lean: async (): Promise<Price[]> => [...prices],
      }),
      watch: () => emitter,
    },
  };

  const rideRepositoryMock = {
    get: jest.fn(),
    create: jest.fn(),
  };

  let fastifyRequestMock: any = {
    headers: {
      "user-agent": "foo",
    },
    raw: { headers: { "x-client-ip": "127.0.0.1" } },
    session: { user: {} },
  };

  const fastifyResponseMock = {
    code: jest.fn(),
    send: jest.fn(),
  };

  const mockRoute = () => {
    const point: TRoutePoint = {
      coord: [0, 0],
      primary: "foo",
      secondary: "foo",
      district: "foo",
    };

    const body = new CreateRideDto();
    body.country = "BR";
    body.area = "AL";
    body.subArea = "maceio";
    body.payMethod = RidePayMethods.Money;
    body.type = RideTypes.Normal;
    body.route = {
      start: point,
      end: point,
      path: path.encoded,
      distance: path.distance,
      duration: path.duration,
    };

    return body;
  };

  beforeEach(() => {
    rideService = new RidesService(repositoryServiceMock as any);
    controller = new RidesController(
      cacheMock as any,
      repositoryServiceMock as any,
      rideRepositoryMock as any,
      rideService,
    );
  });

  afterEach(() => {
    fastifyRequestMock = {
      headers: {
        "user-agent": "foo",
      },
      raw: { headers: { "x-client-ip": "127.0.0.1" } },
      session: { user: {} },
    };
    jest.resetAllMocks();
  });

  describe("getPricesStatusHandler", () => {
    it("should return general price", () => {
      const { area, general } = prices[0];
      const params = new GetRidesPricesParams();

      params.area = area;

      const response = controller.getPricesStatusHandler(params);

      expect(response).toStrictEqual({
        target: area,
        list: general,
      });
    });

    it("should return subArea price", () => {
      const { area, general, subAreas } = prices[0];
      const [subArea] = Object.keys(subAreas);

      const params = new GetRidesPricesParams();
      params.area = area;
      params.subArea = subArea;

      const response = controller.getPricesStatusHandler(params);

      expect(response).toStrictEqual({
        target: `${area}/${subArea}`,
        list: general,
      });
    });

    it("should return fallback to general due to non existent subArea", () => {
      const { area, general, subAreas } = prices[0];

      const params = new GetRidesPricesParams();
      params.area = area;
      params.subArea = "not-have";

      const response = controller.getPricesStatusHandler(params);

      expect(response).toStrictEqual({
        target: area,
        list: general,
      });
    });
  });

  describe("getRideDataHandler", () => {
    it("should throw ForbiddenException", async () => {
      const ridePid = shortid.generate();
      fastifyRequestMock.session.user = { pid: shortid.generate() };
      cacheMock.get.mockResolvedValue(shortid.generate());

      await expect(
        controller.getRideDataHandler(fastifyRequestMock, ridePid),
      ).rejects.toStrictEqual(new ForbiddenException());
    });

    it("should throw NotFoundException", async () => {
      const ridePid = shortid.generate();
      const driverPid = shortid.generate();
      fastifyRequestMock.session.user = { pid: driverPid };
      cacheMock.get.mockResolvedValue(driverPid);
      rideRepositoryMock.get.mockResolvedValue(null);

      await expect(
        controller.getRideDataHandler(fastifyRequestMock, ridePid),
      ).rejects.toStrictEqual(new NotFoundException());
    });

    it("should throw NotFoundException", async () => {
      const ridePid = shortid.generate();
      const driverPid = shortid.generate();
      const rideData = { pendencies: { foo: "bar" }, route: { foo: "foo" } };
      const { pendencies, ...expected } = rideData;

      fastifyRequestMock.session.user = { pid: driverPid };
      cacheMock.get.mockResolvedValue(driverPid);
      rideRepositoryMock.get.mockResolvedValue(rideData);

      const response = await controller.getRideDataHandler(
        fastifyRequestMock,
        ridePid,
      );

      expect(response).toStrictEqual(expected);
    });
  });

  describe("createRideHandler", () => {
    it("should create without any pendencie", async () => {
      const voyagerId = new Types.ObjectId();
      const voyagerPid = shortid.generate();
      const generatedRidePid = shortid.generate();
      const voyagerPendencies: [] = [];

      repositoryServiceMock.pendencieModel.find.mockResolvedValue(
        voyagerPendencies,
      );
      rideRepositoryMock.create.mockResolvedValue({
        pid: generatedRidePid,
      });
      fastifyRequestMock.session.user = { _id: voyagerId, pid: voyagerPid };

      const body = mockRoute();
      const calculatedPrices = rideService.getRideCosts(body);
      const costsSummary =
        calculatedPrices.distance.total + calculatedPrices.duration.total;
      const expectedCosts = {
        ...calculatedPrices,
        base: costsSummary,
        total: costsSummary,
      };

      const response = await controller.createRideHandler(
        fastifyRequestMock,
        body,
      );

      expect(response).toStrictEqual({
        pid: generatedRidePid,
        costs: expectedCosts,
        pendencies: voyagerPendencies,
      });

      expect(rideRepositoryMock.create.mock.calls[0][0]).toStrictEqual({
        ...body,
        voyager: voyagerId,
        costs: expectedCosts,
        pendencies: voyagerPendencies,
      });
    });

    it("should create with a pendencie", async () => {
      const voyagerId = new Types.ObjectId();
      const voyagerPid = shortid.generate();
      const generatedRidePid = shortid.generate();
      const voyagerPendencies: any[] = [{ amount: 3 }];

      repositoryServiceMock.pendencieModel.find.mockResolvedValue(
        voyagerPendencies,
      );
      rideRepositoryMock.create.mockResolvedValue({
        pid: generatedRidePid,
      });
      fastifyRequestMock.session.user = { _id: voyagerId, pid: voyagerPid };

      const body = mockRoute();
      const calculatedPrices = rideService.getRideCosts(body);
      const costsSummary =
        calculatedPrices.distance.total + calculatedPrices.duration.total;
      const expectedCosts = {
        ...calculatedPrices,
        base: costsSummary,
        total: costsSummary + voyagerPendencies[0].amount,
      };

      const response = await controller.createRideHandler(
        fastifyRequestMock,
        body,
      );

      expect(response).toStrictEqual({
        pid: generatedRidePid,
        costs: expectedCosts,
        pendencies: voyagerPendencies,
      });

      expect(rideRepositoryMock.create.mock.calls[0][0]).toStrictEqual({
        ...body,
        voyager: voyagerId,
        costs: expectedCosts,
        pendencies: voyagerPendencies,
      });
    });
  });
});
