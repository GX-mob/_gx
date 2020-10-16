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
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from "@nestjs/common";
import { AuthGuard, AuthorizedRequest, Driver } from "@app/auth";
import { CacheService } from "@app/cache";
import { RepositoryService, RideRepository } from "@app/repositories";
import { util } from "@app/helpers";
import { RidesService } from "./rides.service";
import {
  GetRideInfoDto,
  GetRidesPricesDto,
  CreateRideDto,
  CreatedRideDto,
} from "./rides.dto";
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
  getPricesStatusHandler(@Param() { area, subArea }: GetRidesPricesDto) {
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
  @Get(":pid")
  async getRideDataHandler(
    @Request() req: AuthorizedRequest,
    @Param() { pid }: GetRideInfoDto,
  ) {
    const { pid: driverPid } = req.session.user;

    const readPermission = await this.cache.get(
      CACHE_NAMESPACES.RIDE_READ_PERMISSIONS,
      pid,
    );

    if (driverPid !== readPermission) {
      throw new ForbiddenException();
    }

    const ride = await this.rideRepository.get({ pid });

    if (!ride) {
      throw new NotFoundException();
    }

    const { pendencies, ...publicData } = ride;

    return publicData;
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
  })
  async createRideHandler(
    @Request() req: AuthorizedRequest,
    @Body() body: CreateRideDto,
  ) {
    const ride = await this.rideService.create(req.session.user._id, body);
    return new CreatedRideDto(ride);
  }
}
