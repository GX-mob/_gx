import { AuthGuard, DAccount, Driver } from "@app/auth";
import { Account, EAccountRoles } from "@core/domain/account";
import { RideRoute } from "@core/routes";
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { RideNoReadPermission, RideNotFoundException } from "./exceptions";
import {
  CreateRideDto,
  GetRideInfoDto,
  GetRidesPricesDto,
  RideInfoDto,
} from "./rides.dto";
import { RidesService } from "./rides.service";

const basePath = RideRoute.basePath;
const findPath = RideRoute.route("find", {
  endpointOnly: true
});

const priceStatusPath = RideRoute.route("prices-status", {
  endpointOnly: true
});

@Controller(basePath)
@UseGuards(AuthGuard)
export class RidesController {
  constructor(readonly rideService: RidesService) {}

  @Get(priceStatusPath)
  getPricesStatusHandler(@Param() { area, subArea }: GetRidesPricesDto) {
    return this.rideService.getPricesOfRidesType(area, subArea);
  }

  @Driver()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    excludePrefixes: ["_"],
    groups: [EAccountRoles.Driver],
  })
  @Get(findPath)
  async find(
    @DAccount() account: Account,
    @Param() { pid }: GetRideInfoDto,
  ) {
    const driverPid = account.getID();
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
    groups: [EAccountRoles.Voyager],
  })
  async createRideHandler(
    @DAccount() account: Account,
    @Body() body: CreateRideDto,
  ) {
    const ride = await this.rideService.create(account, body);
    return new RideInfoDto(ride);
  }
}
