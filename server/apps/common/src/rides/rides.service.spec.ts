/**
 * Data Service
 *
 * @group unit/services/ride
 */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { parseISO } from "date-fns";
import {
  RideTypes,
  RoutePointInterface,
  RideAreaConfigurationInterface,
} from "@shared/interfaces";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { RidesService } from "./rides.service";
import { EventEmitter } from "events";

import { rideType1, prices, path } from "./__mocks__";

describe("RideService", () => {
  let service: RidesService;
  const emitter = new EventEmitter();

  emitter.setMaxListeners(50);

  const repositoryServiceMock = {
    rideAreaConfigurationModel: {
      find: () => ({
        lean: async (): Promise<RideAreaConfigurationInterface[]> => [
          ...prices,
        ],
      }),
      watch: () => emitter,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), RepositoryModule],
      providers: [RidesService],
    })
      .overrideProvider(RepositoryService)
      .useValue(repositoryServiceMock)
      .compile();

    service = module.get<RidesService>(RidesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should has rides types loaded", async () => {
    const prices = await repositoryServiceMock.rideAreaConfigurationModel
      .find()
      .lean();
    const areas: { [area: string]: RideAreaConfigurationInterface } = {};

    prices.forEach((price) => {
      areas[price.area] = price;
    });

    expect(service.areas).toStrictEqual(areas);
  });

  it("should update area prices", async () => {
    const prices = await repositoryServiceMock.rideAreaConfigurationModel
      .find()
      .lean();

    const newRideType1Values = {
      ...rideType1,
      perKilometer: 1.7,
      perMinute: 0.6,
      kilometerMultipler: 0.4,
      minuteMultipler: 0.3,
      overBusinessTimeKmAdd: 0.7,
      overBusinessTimeMinuteAdd: 0.6,
    };

    emitter.emit("change", {
      operationType: "update",
      fullDocument: {
        ...prices[0],
        general: [prices[0].general[1], newRideType1Values],
      },
    });

    const general = service.areas[prices[0].area].general;

    expect(general).toStrictEqual([prices[0].general[1], newRideType1Values]);
  });

  it("should insert area prices", async () => {
    const newRideType1Values = {
      ...rideType1,
      perKilometer: 1.7,
      perMinute: 0.6,
      kilometerMultipler: 0.4,
      minuteMultipler: 0.3,
      overBusinessTimeKmAdd: 0.7,
      overBusinessTimeMinuteAdd: 0.6,
    };

    const newDocument = {
      ...prices[0],
      area: "SP",
      general: [prices[0].general[1], newRideType1Values],
      subAreas: {},
    };

    emitter.emit("change", {
      operationType: "insert",
      fullDocument: newDocument,
    });

    const general = service.areas[newDocument.area];

    expect(general).toStrictEqual(newDocument);
  });

  describe("getPrice", () => {
    it("should return undefined", () => {
      expect(service.getRideStatusPrice("MG")).toBe(undefined);
    });

    it("should return the price list of an area", () => {
      expect(service.getRideStatusPrice("AL")).toStrictEqual(prices[0].general);
    });

    it("should return the price list of a subArea", () => {
      expect(service.getRideStatusPrice("AL", "maceio")).toStrictEqual(
        prices[0].subAreas["maceio"],
      );
    });

    it("should return the fallback to area due to an undefined subArea", () => {
      expect(service.getRideStatusPrice("AL", "arapiraca")).toStrictEqual(
        prices[0].general,
      );
    });

    it("should return the price of a ride type", () => {
      const [, ridePrice] = prices[0].subAreas["maceio"];

      expect(
        service.getRideStatusPrice("AL", "maceio", ridePrice.type),
      ).toStrictEqual(ridePrice);
    });

    it("should return the fallback price of a ride type", () => {
      const [, ridePrice] = prices[0].subAreas["maceio"];

      expect(
        service.getRideStatusPrice("AL", "arapiraca", ridePrice.type),
      ).toStrictEqual(ridePrice);
    });
  });

  describe("isBusinessTime", () => {
    it("should return true", () => {
      const dateTime = parseISO("2020-06-13 12:00");
      const dateTime2 = parseISO("2020-06-13 20:00");

      expect(service.isBusinessTime("America/Maceio", dateTime)).toBeTruthy();
      expect(service.isBusinessTime("America/Maceio", dateTime2)).toBeTruthy();
    });

    it("should return false", () => {
      const dateTime = parseISO("2020-06-13 11:00");
      const dateTime2 = parseISO("2020-06-13 22:00");
      const sunday = parseISO("2020-06-14 12:00");

      expect(service.isBusinessTime("America/Maceio", dateTime)).toBeFalsy();
      expect(service.isBusinessTime("America/Maceio", dateTime2)).toBeFalsy();
      expect(service.isBusinessTime("America/Maceio", sunday)).toBeFalsy();
    });
  });

  function priceCalculationTest(
    func: "distancePrice" | "durationPrice",
    value: number,
    over: number,
  ) {
    describe(func, () => {
      it("should calculate", () => {
        const costsType1InBusiness = service[func](
          value,
          prices[0].general[0],
          true,
        );
        const costsType2InBusiness = service[func](
          value,
          prices[0].general[1],
          true,
        );
        const costsType1OutBusiness = service[func](
          value,
          prices[0].general[0],
          false,
        );
        const costsType2OutBusiness = service[func](
          value,
          prices[0].general[1],
          false,
        );

        const costsType1OverOutBusiness = service[func](
          value + over,
          prices[0].general[0],
          false,
        );
        const costsType2OverOutBusiness = service[func](
          value + over,
          prices[0].general[1],
          false,
        );

        const costsType1OverInBusiness = service[func](
          value + over,
          prices[0].general[0],
          true,
        );
        const costsType2OverInBusiness = service[func](
          value + over,
          prices[0].general[1],
          true,
        );

        expect(costsType1InBusiness).toMatchSnapshot();
        expect(costsType2InBusiness).toMatchSnapshot();

        expect(costsType1OutBusiness).toMatchSnapshot();
        expect(costsType2OutBusiness).toMatchSnapshot();

        expect(
          costsType1InBusiness.total < costsType1OutBusiness.total,
        ).toBeTruthy();
        expect(
          costsType2InBusiness.total < costsType2OutBusiness.total,
        ).toBeTruthy();

        expect(
          costsType1OverOutBusiness.total > costsType1OutBusiness.total,
        ).toBeTruthy();
        expect(
          costsType2OverOutBusiness.total > costsType2OutBusiness.total,
        ).toBeTruthy();
        expect(costsType1OverOutBusiness.aditionalForLongRide > 0).toBeTruthy();
        expect(costsType2OverOutBusiness.aditionalForLongRide > 0).toBeTruthy();

        expect(
          costsType1OverInBusiness.total > costsType1InBusiness.total,
        ).toBeTruthy();
        expect(
          costsType2OverInBusiness.total > costsType2InBusiness.total,
        ).toBeTruthy();
        expect(costsType1OverInBusiness.aditionalForLongRide > 0).toBeTruthy();
        expect(costsType2OverInBusiness.aditionalForLongRide > 0).toBeTruthy();
      });
    });
  }

  priceCalculationTest("distancePrice", path.distance, 10);
  priceCalculationTest("durationPrice", path.duration, 40);

  describe("getRideCosts", () => {
    it("should calculate ", () => {
      const point: RoutePointInterface = {
        coord: [0, 0],
        primary: "foo",
        secondary: "foo",
        district: "foo",
      };

      const mockCreateRideDto: any = {};
      mockCreateRideDto.route = {
        start: point,
        end: point,
        path: path.encoded,
        distance: path.distance,
        duration: path.duration,
      };
      mockCreateRideDto.area = "AL";
      mockCreateRideDto.subArea = "maceio";
      mockCreateRideDto.type = RideTypes.Normal;

      const isBusinessTime = service.isBusinessTime(prices[0].timezone);
      const distancePrice = service.distancePrice(
        path.distance,
        prices[0].general[0],
        isBusinessTime,
      );
      const durationPrice = service.durationPrice(
        path.duration,
        prices[0].general[0],
        isBusinessTime,
      );

      const total = distancePrice.total + durationPrice.total;

      const ridePrice = service.getRideCosts(mockCreateRideDto);

      expect(distancePrice).toStrictEqual(ridePrice.distance);
      expect(durationPrice).toStrictEqual(ridePrice.duration);
    });
  });
});
