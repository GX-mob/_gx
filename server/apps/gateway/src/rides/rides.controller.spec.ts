/**
 * @group unit/controller
 * @group unit/gateway/controller
 * @group unit/gateway/rides/controller
 */
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheService } from "@app/cache";
import { RepositoryModule, RepositoryService } from "@app/repositories";
import { SessionModule, SessionService } from "@app/session";
import { IRideAreaConfiguration, ISession } from "@shared/interfaces";
import { mockRide, mockSession, mockAreaConfiguration } from "@testing/testing";
import { RidesController } from "./rides.controller";
import { RidesService } from "./rides.service";
import {
  RideInfoDto,
  GetRidesPricesDto,
  CreateRideDto,
  GetRideInfoDto,
} from "./rides.dto";
import { RideNoReadPermission, RideNotFoundException } from "./exceptions";

describe("RidesController", () => {
  let ridesService: RidesService;
  let ridesController: RidesController;
  let sessionService: SessionService;

  const repositoryServiceMock = {
    rideAreaConfigurationModel: {
      find: () => ({
        lean: async (): Promise<IRideAreaConfiguration[]> => [],
      }),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRoot(),
        SessionModule,
        CacheModule,
        RepositoryModule,
      ],
      controllers: [RidesController],
      providers: [SessionService, RidesService],
    })
      .overrideProvider(ConfigService)
      .useValue({ get() {} })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(RepositoryService)
      .useValue(repositoryServiceMock)
      .compile();

    sessionService = moduleRef.get<SessionService>(SessionService);
    ridesService = moduleRef.get<RidesService>(RidesService);
    ridesController = moduleRef.get<RidesController>(RidesController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getPricesStatusHandler", () => {
    let prices: IRideAreaConfiguration[];
    let session: ISession;
    let sessionVerifySpy: jest.SpyInstance;
    let ridesGetPriceOfRydesType: jest.SpyInstance;

    beforeEach(() => {
      prices = [mockAreaConfiguration()];
      session = mockSession();
      sessionVerifySpy = jest
        .spyOn(sessionService, "verify")
        .mockImplementationOnce(async () => session);

      ridesGetPriceOfRydesType = jest
        .spyOn(ridesService, "getPricesOfRidesType")
        .mockImplementationOnce((area: string, subArea?: string) => {
          const config = prices.find(
            (config) => config.area === area,
          ) as IRideAreaConfiguration;

          if (!subArea) return config.general;

          return config.subAreas[subArea] || config.general;
        });
    });

    afterEach(() => {
      sessionVerifySpy.mockReset();
      ridesGetPriceOfRydesType.mockReset();
    });

    it("should return general price", () => {
      const [{ area, general }] = prices;
      const params = new GetRidesPricesDto();
      params.area = area;

      const response = ridesController.getPricesStatusHandler(params);

      expect(response).toStrictEqual(general);
    });

    it("should return subArea price", () => {
      const [{ area, subAreas }] = prices;
      const [subArea] = Object.keys(subAreas);

      const params = new GetRidesPricesDto();
      params.area = area;
      params.subArea = subArea;

      const response = ridesController.getPricesStatusHandler(params);

      expect(response).toStrictEqual(subAreas[subArea]);
    });

    it("should return fallback to general due to non existent subArea", () => {
      const [{ area, general }] = prices;

      const params = new GetRidesPricesDto();
      params.area = area;
      params.subArea = "not-have";

      const response = ridesController.getPricesStatusHandler(params);

      expect(response).toStrictEqual(general);
    });
  });

  describe("getRideDataHandler", () => {
    it("should throw RideNotFoundException", async () => {
      const session = mockSession();

      jest
        .spyOn(sessionService, "verify")
        .mockImplementationOnce(async () => session);

      jest
        .spyOn(ridesService, "getRideByPid")
        .mockImplementationOnce(async () => null);

      const getRideInfoDto = new GetRideInfoDto();
      getRideInfoDto.pid = "no-exist";

      await expect(
        ridesController.getRideDataHandler(session.user, getRideInfoDto),
      ).rejects.toStrictEqual(new RideNotFoundException());
    });

    it("should throw RideNoReadPermission", async () => {
      const session = mockSession();
      const ride = mockRide();

      jest
        .spyOn(sessionService, "verify")
        .mockImplementationOnce(async () => session);

      jest
        .spyOn(ridesService, "getRideByPid")
        .mockImplementationOnce(async (pid: string) =>
          pid === ride.pid ? ride : null,
        );

      const getRideInfoDto = new GetRideInfoDto();
      getRideInfoDto.pid = ride.pid;

      await expect(
        ridesController.getRideDataHandler(session.user, getRideInfoDto),
      ).rejects.toStrictEqual(new RideNoReadPermission());
    });

    it("should return RideInfoDto instance", async () => {
      const session = mockSession();
      const ride = mockRide({ driver: session.user });
      const rideDto = new RideInfoDto(ride);

      jest
        .spyOn(sessionService, "verify")
        .mockImplementationOnce(async () => session);

      jest
        .spyOn(ridesService, "getRideByPid")
        .mockImplementationOnce(async (pid: string) =>
          pid === ride.pid ? ride : null,
        );

      const getRideInfoDto = new GetRideInfoDto();
      getRideInfoDto.pid = ride.pid;

      await expect(
        ridesController.getRideDataHandler(session.user, getRideInfoDto),
      ).resolves.toStrictEqual(rideDto);
    });
  });

  describe("createRideHandler", () => {
    it("should create", async () => {
      const session = mockSession();
      const ride = mockRide();
      delete ride.driver;
      const rideDto = new RideInfoDto(ride);
      const createRideDto = new CreateRideDto();
      createRideDto.area = ride.area;
      createRideDto.subArea = ride.subArea;
      createRideDto.country = ride.country;
      createRideDto.route = ride.route;
      createRideDto.type = ride.type;

      jest
        .spyOn(sessionService, "verify")
        .mockImplementationOnce(async () => session);

      jest
        .spyOn(ridesService, "create")
        .mockImplementationOnce(async () => ride);

      await expect(
        ridesController.createRideHandler(session.user, createRideDto),
      ).resolves.toStrictEqual(rideDto);
    });
  });
});
