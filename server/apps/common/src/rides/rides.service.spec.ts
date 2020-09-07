/**
 * Data Service
 *
 * @group unit/services/ride
 */
import { Test, TestingModule } from "@nestjs/testing";
import { parseISO } from "date-fns";
import {
  DatabaseModule,
  DatabaseService,
  Price,
  PriceDetail,
  TRoutePoint,
  RideTypes,
} from "@app/database";
import { RidesService } from "./rides.service";
import { EventEmitter } from "events";
import { geometry } from "@app/helpers";
import { utcToZonedTime } from "date-fns-tz";
//@ts-ignore
const { decode } = require("google-polyline");

describe("RideService", () => {
  let service: RidesService;
  const emitter = new EventEmitter();

  emitter.setMaxListeners(50);

  const rideType1: PriceDetail = {
    type: 1,
    available: true,
    perKilometer: 1.1,
    perMinute: 0.3,
    kilometerMultipler: 0.2,
    minuteMultipler: 0.1,
    overBusinessTimeKmAdd: 0.4,
    overBusinessTimeMinuteAdd: 0.3,
  };

  const rideType2: PriceDetail = {
    type: 2,
    available: true,
    perKilometer: 1.6,
    perMinute: 0.5,
    kilometerMultipler: 0.3,
    minuteMultipler: 0.2,
    overBusinessTimeKmAdd: 0.6,
    overBusinessTimeMinuteAdd: 0.5,
  };

  const prices: Price[] = [
    {
      area: "AL",
      currency: "BRL",
      timezone: "America/Maceio",
      general: [rideType1, rideType2],
      subAreas: {
        maceio: [rideType1, rideType2],
      },
    },
    {
      area: "PE",
      currency: "BRL",
      timezone: "America/Maceio",
      general: [rideType1, rideType2],
      subAreas: {
        recife: [rideType1, rideType2],
      },
    },
  ];

  const databaseServiceMock = {
    priceModel: {
      find: () => ({
        lean: async (): Promise<Price[]> => [...prices],
      }),
      watch: () => emitter,
    },
  };

  const pathEncodedMock =
    "_jn~Fh_}uOlIr@dNxCxIOxIgB|HmElEmE~BeI~BsHjAwIh@yHjAkLdDcHxCkDjCwBfFcApCIdDO~B?dDc@dD?";
  const pathDecodedMock = decode(pathEncodedMock);
  const pathDistance = geometry.distance.meterToKM(
    geometry.distance.path(pathDecodedMock),
  );
  const pathDuration = 10;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [RidesService],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .compile();

    service = module.get<RidesService>(RidesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should has rides types loaded", async () => {
    const prices = await databaseServiceMock.priceModel.find().lean();
    const areas: { [area: string]: Price } = {};

    prices.forEach((price) => {
      areas[price.area] = price;
    });

    expect(service.areas).toStrictEqual(areas);
  });

  it("should update area prices", async () => {
    const prices = await databaseServiceMock.priceModel.find().lean();

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
      });
    });
  }

  priceCalculationTest("distancePrice", pathDistance);
  priceCalculationTest("durationPrice", pathDuration);

  describe("getRideCosts", () => {
    it("should calculate ", () => {
      const point: TRoutePoint = {
        coord: [0, 0],
        primary: "foo",
        secondary: "foo",
        district: "foo",
      };

      const mockCreateRideDto: any = {};
      mockCreateRideDto.route = {
        start: point,
        end: point,
        path: pathEncodedMock,
        distance: pathDistance,
        duration: pathDuration,
      };
      mockCreateRideDto.area = "AL";
      mockCreateRideDto.subArea = "maceio";
      mockCreateRideDto.type = RideTypes.Normal;

      const distancePrice = service.distancePrice(
        pathDistance,
        prices[0].general[0],
        false,
      );
      const durationPrice = service.durationPrice(
        pathDuration,
        prices[0].general[0],
        false,
      );

      const total = distancePrice.total + durationPrice.total;

      const ridePrice = service.getRideCosts(mockCreateRideDto);

      expect(distancePrice).toStrictEqual(ridePrice.distance);
      expect(durationPrice).toStrictEqual(ridePrice.duration);
    });
  });
});
