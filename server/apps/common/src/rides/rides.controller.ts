import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Request,
  NotFoundException,
  ForbiddenException,
  Body,
} from "@nestjs/common";
import { AuthGuard, AuthorizedRequest, Driver } from "@app/auth";
import { CacheService } from "@app/cache";
import { RepositoryService, RideRepository } from "@app/repositories";
import { util } from "@app/helpers";
import { RidesService } from "./rides.service";
import { GetRidesPricesParams, CreateRideDto } from "./rides.dto";
import { CACHE_NAMESPACES } from "../constants";

@Controller("rides/")
@UseGuards(AuthGuard)
export class RidesController {
  constructor(
    readonly cache: CacheService,
    readonly repositoryService: RepositoryService,
    readonly rideRepository: RideRepository,
    readonly rideService: RidesService,
  ) {}

  @Get("prices-status/:area/:subArea?")
  getPricesStatusHandler(@Param() params: GetRidesPricesParams) {
    const { area, subArea } = params;
    const list = this.rideService.getRideStatusPrice(area, subArea);

    const target = util.hasProp(
      this.rideService.areas[area].subAreas,
      subArea || "",
    )
      ? `${area}/${subArea}`
      : area;

    return { target, list };
  }

  @Driver()
  @Get("ride-info/:pid")
  async getRideDataHandler(
    @Request() req: AuthorizedRequest,
    @Param("pid") ridePid: string,
  ) {
    const { pid: driverPid } = req.session.user;

    const readPermission = await this.cache.get(
      CACHE_NAMESPACES.RIDE_READ_PERMISSIONS,
      ridePid,
    );

    if (driverPid !== readPermission) {
      throw new ForbiddenException();
    }

    const ride = await this.rideRepository.get({ pid: ridePid });

    if (!ride) {
      throw new NotFoundException();
    }

    const { pendencies, ...publicData } = ride;

    return publicData;
  }

  @Post()
  async createRideHandler(
    @Request() req: AuthorizedRequest,
    @Body() body: CreateRideDto,
  ) {
    const { _id: voyagerId } = req.session.user;

    /**
     * Get user pendencies
     */
    const { pendencieModel } = this.repositoryService;
    const pendencies = await pendencieModel.find({ issuer: voyagerId });

    const { route, type, payMethod, country, area, subArea } = body;

    /**
     * Calculate rides costs
     */
    const rideCosts = this.rideService.getRideCosts(body);
    const base = rideCosts.duration.total + rideCosts.distance.total;
    const total = pendencies.reduce((currentAmount, pendencie) => {
      return currentAmount + pendencie.amount;
    }, base);

    const costs = { ...rideCosts, base, total };

    const { pid } = await this.rideRepository.create({
      voyager: voyagerId,
      route,
      type,
      pendencies,
      payMethod,
      country,
      area,
      subArea,
      costs,
    });

    return { pid, costs, pendencies };
  }
}
