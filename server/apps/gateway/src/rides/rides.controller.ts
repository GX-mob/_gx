import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from "@nestjs/common";
import { AuthGuard, Driver, DUser } from "@app/auth";
import { RidesService } from "./rides.service";
import {
  GetRideInfoDto,
  GetRidesPricesDto,
  CreateRideDto,
  RideInfoDto,
} from "./rides.dto";
import { IUser, EUserRoles, User } from "@core/domain/user";
import { RideNoReadPermission, RideNotFoundException } from "./exceptions";

@Controller("rides/")
@UseGuards(AuthGuard)
export class RidesController {
  constructor(readonly rideService: RidesService) {}

  @Get("prices-status/:area/:subArea?")
  getPricesStatusHandler(@Param() { area, subArea }: GetRidesPricesDto) {
    return this.rideService.getPricesOfRidesType(area, subArea);
  }

  @Driver()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
    groups: [EUserRoles.Driver],
  })
  @Get(":pid")
  async getRideDataHandler(
    @DUser() user: User,
    @Param() { pid }: GetRideInfoDto,
  ) {
    const driverPid = user.getID();
    const ride = await this.rideService.getRideByPid(pid);

    if (!ride) throw new RideNotFoundException();
    if (!ride.driver || ride.driver.pid !== driverPid)
      throw new RideNoReadPermission();

    return new RideInfoDto(ride);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
    groups: [EUserRoles.Voyager],
  })
  async createRideHandler(@DUser() user: User, @Body() body: CreateRideDto) {
    const ride = await this.rideService.create(user, body);
    return new RideInfoDto(ride);
  }
}
