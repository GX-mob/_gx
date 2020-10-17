import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  NotFoundException,
  ForbiddenException,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from "@nestjs/common";
import { AuthGuard, Driver, User } from "@app/auth";
import { CacheService } from "@app/cache";
import { util } from "@app/helpers";
import { RidesService } from "./rides.service";
import {
  GetRideInfoDto,
  GetRidesPricesDto,
  CreateRideDto,
  RideInfoDto,
} from "./rides.dto";
import { IUser } from "@shared/interfaces";

@Controller("rides/")
@UseGuards(AuthGuard)
export class RidesController {
  constructor(
    readonly cache: CacheService,
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
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
    groups: ["driver"],
  })
  async getRideDataHandler(
    @User() user: IUser,
    @Param() { pid }: GetRideInfoDto,
  ) {
    const { pid: driverPid } = user;
    const ride = await this.rideService.getRideByPid(pid);

    if (!ride) throw new NotFoundException();
    if (ride.driver !== driverPid) throw new ForbiddenException();

    return new RideInfoDto(ride);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
    groups: ["voyager"],
  })
  async createRideHandler(@User() user: IUser, @Body() body: CreateRideDto) {
    const ride = await this.rideService.create(user._id, body);
    return new RideInfoDto(ride);
  }
}
