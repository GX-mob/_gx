/**
 * @group unit/service
 * @group unit/gateway/service
 * @group unit/gateway/rides/service
 */
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import faker from "faker";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import {
  RepositoryModule,
  RideRepository,
  PendencieRepository,
  RideAreaConfigurationRepository,
} from "@app/repositories";
import { AuthModule, AuthService } from "@app/auth";
import { parseISO } from "date-fns";
import { IRide, RideTypes, IRideAreaConfiguration } from "@shared/interfaces";
import { RidesService } from "./rides.service";
import {
  mockRide,
  mockAreaConfiguration,
  mockRideTypeConfiguration,
  mockPendencie,
} from "@testing/testing";
import {
  InvalidRideTypeException,
  UnsupportedAreaException,
} from "./exceptions";
import { CreateRideDto } from "./rides.dto";
import { AccountService } from "../user/account.service";

describe("RideService", () => {
  let ridesService: RidesService;
  let rideRepository: RideRepository;
  const { route } = mockRide();
  const rideType1 = mockRideTypeConfiguration();
  const rideType2 = mockRideTypeConfiguration({
    type: 2,
    available: true,
    perKilometer: 1.6,
    perMinute: 0.5,
    kilometerMultipler: 0.3,
    minuteMultipler: 0.2,
    overBusinessTimeKmAdd: 0.6,
    overBusinessTimeMinuteAdd: 0.5,
  });
  const prices = [
    mockAreaConfiguration({
      general: [rideType1, rideType2],
    }),
  ];

  const pendencieRepositoryMock = {
    model: { find: jest.fn() },
  };

  const rideAreaConfigurationRepositoryMock = {
    model: {
      find: () => ({
        lean: async (): Promise<IRideAreaConfiguration[]> => [...prices],
      }),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        AuthModule,
        CacheModule,
        RepositoryModule,
      ],
      providers: [AuthService, RidesService],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(PendencieRepository)
      .useValue(pendencieRepositoryMock)
      .overrideProvider(RideAreaConfigurationRepository)
      .useValue(rideAreaConfigurationRepositoryMock)
      .compile();

    ridesService = moduleRef.get<RidesService>(RidesService);
    rideRepository = moduleRef.get<RideRepository>(RideRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should be defined", () => {
    expect(ridesService).toBeDefined();
  });

  it("should has rides types loaded", async () => {
    const prices = await rideAreaConfigurationRepositoryMock.model
      .find()
      .lean();
    const areas: { [area: string]: IRideAreaConfiguration } = {};

    prices.forEach((price) => {
      areas[price.area] = price;
    });

    expect(ridesService.areas).toStrictEqual(areas);
  });

  describe("getRideByPid", () => {
    it("should call rideRepository", async () => {
      const pid = faker.random.alphaNumeric(12);
      const rideRepositoryGet = jest
        .spyOn(rideRepository, "get")
        .mockResolvedValue(null);

      await ridesService.getRideByPid(pid);

      expect(rideRepositoryGet).toBeCalledWith({ pid });
    });
  });

  describe("getRideStatusPrice", () => {
    it("should throw UnsupportedAreaException", async () => {
      expect(() =>
        ridesService.getPricesOfRidesType("NON-EXISTENT"),
      ).toThrowError(new UnsupportedAreaException());
    });

    it("should return the price list of an area", () => {
      const { area } = prices[0];

      expect(ridesService.getPricesOfRidesType(area)).toStrictEqual(
        prices[0].general,
      );
    });

    it("should return the price list of an area", () => {
      const { area } = prices[0];
      const [subArea] = Object.keys(prices[0].subAreas);

      expect(ridesService.getPricesOfRidesType(area, subArea)).toStrictEqual(
        prices[0].subAreas[subArea],
      );
    });

    it("should return the fallback to area due to an undefined subArea", () => {
      const { area } = prices[0];

      expect(ridesService.getPricesOfRidesType(area, "not-have")).toStrictEqual(
        prices[0].general,
      );
    });
  });

  describe("isBusinessTime", () => {
    it("should return true", () => {
      const dateTime = parseISO("2020-06-13 12:00");
      const dateTime2 = parseISO("2020-06-13 20:00");

      expect(
        ridesService.isBusinessTime("America/Maceio", dateTime),
      ).toBeTruthy();
      expect(
        ridesService.isBusinessTime("America/Maceio", dateTime2),
      ).toBeTruthy();
    });

    it("should return false", () => {
      const dateTime = parseISO("2020-06-13 11:00");
      const dateTime2 = parseISO("2020-06-13 22:00");
      const sunday = parseISO("2020-06-14 12:00");

      expect(
        ridesService.isBusinessTime("America/Maceio", dateTime),
      ).toBeFalsy();
      expect(
        ridesService.isBusinessTime("America/Maceio", dateTime2),
      ).toBeFalsy();
      expect(ridesService.isBusinessTime("America/Maceio", sunday)).toBeFalsy();
    });
  });

  describe("getCostsOfRideType", () => {
    it("should throw InvalidRideTypeException", () => {
      expect(() =>
        ridesService.getCostsOfRideType(prices[0].general, 3),
      ).toThrowError(new InvalidRideTypeException());
    });

    it("should return the prices", () => {
      expect(
        ridesService.getCostsOfRideType(prices[0].general, RideTypes.Normal),
      ).toStrictEqual(
        prices[0].general.find((price) => price.type === RideTypes.Normal),
      );
    });
  });

  describe("create", () => {
    function makeCrateRideDto(ride: IRide) {
      const createRideDto = new CreateRideDto();
      createRideDto.route = ride.route;
      createRideDto.type = ride.type;
      createRideDto.payMethod = ride.payMethod;
      createRideDto.country = ride.country;
      createRideDto.area = ride.area;
      createRideDto.subArea = ride.subArea;

      return createRideDto;
    }

    it("should create with pendencie", async () => {
      const ride = mockRide();
      const createRideDto = makeCrateRideDto(ride);
      const rideRepositoryCreateSpy = jest.spyOn(rideRepository, "create");

      rideRepositoryCreateSpy.mockImplementation(
        async (input) => input as IRide,
      );

      pendencieRepositoryMock.model.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue([]),
      }));

      await ridesService.create(ride.voyager._id, createRideDto);

      const expectBaseCosts = ridesService.getRideCosts(ride);
      const expectTotalBaseCosts =
        expectBaseCosts.distance.total + expectBaseCosts.duration.total;
      const [[{ costs }]] = rideRepositoryCreateSpy.mock.calls;

      expect(costs.base).toBe(expectTotalBaseCosts);
      expect(costs.total).toBe(expectTotalBaseCosts);
    });

    it("should create without pendencies", async () => {
      const ride = mockRide();
      const pendencie = mockPendencie({ issuer: ride.voyager._id });
      const createRideDto = makeCrateRideDto(ride);
      const rideRepositoryCreateSpy = jest.spyOn(rideRepository, "create");

      rideRepositoryCreateSpy.mockImplementation(
        async (input) => input as IRide,
      );

      pendencieRepositoryMock.model.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue([pendencie]),
      }));
      await ridesService.create(ride.voyager._id, createRideDto);

      const expectBaseCosts = ridesService.getRideCosts(ride);
      const expectTotalBaseCosts =
        expectBaseCosts.distance.total + expectBaseCosts.duration.total;
      const [[{ costs, pendencies }]] = rideRepositoryCreateSpy.mock.calls;

      expect(pendencies).toStrictEqual([pendencie]);
      expect(costs.base).toBe(expectTotalBaseCosts);
      expect(costs.total).toBe(expectTotalBaseCosts + pendencie.amount);
    });
  });

  function priceCalculationTest(
    func: "distancePrice" | "durationPrice",
    value: number,
    over: number,
  ) {
    describe(func, () => {
      it("should calculate", () => {
        const costsType1InBusiness = ridesService[func](
          value,
          prices[0].general[0],
          true,
        );
        const costsType2InBusiness = ridesService[func](
          value,
          prices[0].general[1],
          true,
        );
        const costsType1OutBusiness = ridesService[func](
          value,
          prices[0].general[0],
          false,
        );
        const costsType2OutBusiness = ridesService[func](
          value,
          prices[0].general[1],
          false,
        );

        const costsType1OverOutBusiness = ridesService[func](
          value + over,
          prices[0].general[0],
          false,
        );
        const costsType2OverOutBusiness = ridesService[func](
          value + over,
          prices[0].general[1],
          false,
        );

        const costsType1OverInBusiness = ridesService[func](
          value + over,
          prices[0].general[0],
          true,
        );
        const costsType2OverInBusiness = ridesService[func](
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

  priceCalculationTest("distancePrice", route.distance, 10);
  priceCalculationTest("durationPrice", route.duration, 40);

  describe("getRideCosts", () => {
    it("should calculate ", () => {
      const mockCreateRideDto: any = {};
      mockCreateRideDto.route = { ...route };
      mockCreateRideDto.area = "AL";
      mockCreateRideDto.subArea = "maceio";
      mockCreateRideDto.type = RideTypes.Normal;

      const ridePrice = ridesService.getRideCosts(mockCreateRideDto);
      const isBusinessTime = ridesService.isBusinessTime(prices[0].timezone);
      const distancePrice = ridesService.distancePrice(
        route.distance,
        prices[0].general[0],
        isBusinessTime,
      );
      const durationPrice = ridesService.durationPrice(
        route.duration,
        prices[0].general[0],
        isBusinessTime,
      );

      expect(distancePrice).toStrictEqual(ridePrice.distance);
      expect(durationPrice).toStrictEqual(ridePrice.duration);
    });
  });
});
