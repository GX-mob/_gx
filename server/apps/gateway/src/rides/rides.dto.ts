import {
  IGetRideInfoDto,
  IGetRidePricesDto,
  ICreateRideDto,
} from "@core/interfaces";

import {
  IRide,
  ERideTypes,
  ERidePayMethods,
  ERideStatus,
  IRoute,
  IRoutePoint,
} from "@core/domain/ride"

import {
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsArray,
} from "class-validator";
import { Exclude, Expose } from "class-transformer";
import { EUserRoles } from "@core/domain/user";

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

  @IsEnum(ERideTypes)
  type!: ERideTypes;

  @IsEnum(ERidePayMethods)
  payMethod!: ERidePayMethods;

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

  @Expose({ groups: [EUserRoles.Driver] })
  voyager!: any;

  @Expose({ groups: [EUserRoles.Driver] })
  route!: IRoute;

  @Expose({ groups: [EUserRoles.Driver] })
  type!: ERideTypes;

  @Expose({ groups: [EUserRoles.Driver] })
  payMethod!: ERidePayMethods;

  costs!: IRide["costs"];

  @Exclude()
  country!: string;
  @Exclude()
  area!: string;
  @Exclude()
  subArea!: string;
  @Exclude()
  status!: ERideStatus;
  @Expose({ groups: [EUserRoles.Voyager] })
  driver?: any;

  constructor(ride: IRide) {
    Object.assign(this, ride);
  }
}
