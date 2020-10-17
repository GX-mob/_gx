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
  voyager!: any;
  route!: IRoute;
  /**
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  type!: RideTypes;
  /**
   * * 1 = Money
   * * 2 = Credit card
   */
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
  driver?: any;
  @Expose({ groups: ["voyager"] })
  pendencies?: IPendencie[];

  constructor(ride: IRide) {
    Object.assign(this, ride);
  }
}
