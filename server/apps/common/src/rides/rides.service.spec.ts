/**
 * Data Service
 *
 * @group unit/services/ride
 */
import { Test, TestingModule } from "@nestjs/testing";
import {
  DatabaseModule,
  DatabaseService,
  Price,
  PriceDetail,
} from "@app/database";
import { RidesService } from "./rides.service";
import { EventEmitter } from "events";

describe("RideService", () => {
  let service: RidesService;
  const emitter = new EventEmitter();

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
      general: [rideType1, rideType2],
      subAreas: {
        maceio: [rideType1, rideType2],
      },
    },
    {
      area: "PE",
      currency: "BRL",
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

  it('should throw Error("Empty rides types list")', async () => {
    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [DatabaseModule],
        providers: [RidesService],
      })
        .overrideProvider(DatabaseService)
        .useValue({
          priceModel: {
            find: () => ({
              lean: async (): Promise<Price[]> => [],
            }),
          },
        })
        .compile();
    } catch (error) {
      expect(error).toStrictEqual(new Error("Empty rides types list"));
    }
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
      expect(service.getPrice("MG")).toBe(undefined);
    });

    it("should return the price list of an area", () => {
      expect(service.getPrice("AL")).toStrictEqual(prices[0].general);
    });

    it("should return the price list of a subArea", () => {
      expect(service.getPrice("AL", "maceio")).toStrictEqual(
        prices[0].subAreas["maceio"],
      );
    });

    it("should return the fallback to area due to an undefined subArea", () => {
      expect(service.getPrice("AL", "arapiraca")).toStrictEqual(
        prices[0].general,
      );
    });

    it("should return the price of a ride type", () => {
      const [, ridePrice] = prices[0].subAreas["maceio"];

      expect(service.getPrice("AL", "maceio", ridePrice.type)).toStrictEqual(
        ridePrice,
      );
    });

    it("should return the fallback price of a ride type", () => {
      const [, ridePrice] = prices[0].subAreas["maceio"];

      expect(service.getPrice("AL", "arapiraca", ridePrice.type)).toStrictEqual(
        ridePrice,
      );
    });
  });
});
