import {
  IRide,
  RideTypes,
  RidePayMethods,
  IRoute,
  IRoutePoint,
  IGetRideInfoDto,
  IGetRidePricesDto,
  ICreateRideDto,
  IPendencie,
  RideStatus,
} from "@shared/interfaces";
import {
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsArray,
} from "class-validator";
import { Exclude, Expose } from "class-transformer";
import { UserRoles } from "@shared/interfaces";

class Point implements IRoutePoint {
  @IsArray()
  coord!: [number, number];

  @IsNotEmpty()
  primary!: string;

  @IsNotEmpty()
  secondary!: string;

  @IsNotEmpty()
  district!: string;
}

class Route implements IRoute {
  @ValidateNested()
  start!: Point;

  @ValidateNested()
  waypoints?: Point[];

  @ValidateNested()
  end!: Point;

  @IsNotEmpty()
  path!: string;

  @IsInt()
  distance!: number;

  @IsInt()
  duration!: number;
}

export class GetRideInfoDto implements IGetRideInfoDto {
  @IsNotEmpty()
  pid!: IRide["pid"];
}

export class GetRidesPricesDto implements IGetRidePricesDto {
  @IsNotEmpty()
  area!: IRide["area"];

  @IsString()
  subArea?: IRide["subArea"];
}

export class CreateRideDto implements ICreateRideDto {
  @ValidateNested()
  route!: Route;

  @IsEnum(RideTypes)
  type!: RideTypes;

  @IsEnum(RidePayMethods)
  payMethod!: RidePayMethods;

  @IsNotEmpty()
  country!: IRide["country"];

  @IsNotEmpty()
  area!: IRide["area"];

  @IsNotEmpty()
  subArea!: IRide["subArea"];
}

export class RideInfoDto implements IRide {
  _id!: any;
  pid!: string;
  @Expose({ groups: [UserRoles.DRIVER] })
  voyager!: any;
  @Expose({ groups: [UserRoles.DRIVER] })
  route!: IRoute;
  /**
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  @Expose({ groups: [UserRoles.DRIVER] })
  type!: RideTypes;
  /**
   * * 1 = Money
   * * 2 = Credit card
   */
  @Expose({ groups: [UserRoles.DRIVER] })
  payMethod!: RidePayMethods;
  /**
   * Ride costs
   */
  costs!: IRide["costs"];

  @Exclude()
  country!: string;
  @Exclude()
  area!: string;
  @Exclude()
  subArea!: string;
  @Exclude()
  status!: RideStatus;
  @Expose({ groups: [UserRoles.VOYAGER] })
  driver?: any;
  @Expose({ groups: [UserRoles.VOYAGER] })
  pendencies?: IPendencie[];

  constructor(ride: IRide) {
    Object.assign(this, ride);
  }
}
