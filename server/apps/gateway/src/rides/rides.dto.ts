import {
  ERidePayMethods,
  ERideStatus,
  ERideTypes,
  IRide,
  IRideCosts,
  IRoute,
  IRoutePoint,
} from "@core/domain/ride";
import { EUserRoles } from "@core/domain/user";
import {
  TCreateRideDto,
  TGetRideInfoDto,
  TGetRidePricesDto,
} from "@core/interfaces";
import { Exclude, Expose } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

class Point implements IRoutePoint {
  @IsArray()
  coord!: [number, number];

  @IsNotEmpty()
  @IsString()
  primary!: string;

  @IsNotEmpty()
  @IsString()
  secondary!: string;

  @IsNotEmpty()
  @IsString()
  district!: string;
}

class Route implements IRoute {
  @ValidateNested()
  start!: Point;

  @ValidateNested()
  @IsArray()
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

export class GetRideInfoDto implements TGetRideInfoDto {
  @IsNotEmpty()
  pid!: string;
}

export class GetRidesPricesDto implements TGetRidePricesDto {
  @IsNotEmpty()
  area!: string;

  @IsString()
  subArea!: string;
}

export class CreateRideDto implements TCreateRideDto {
  @ValidateNested()
  route!: Route;

  @IsEnum(ERideTypes)
  type!: ERideTypes;

  @IsEnum(ERidePayMethods)
  payMethod!: ERidePayMethods;

  @IsNotEmpty()
  country!: string;

  @IsNotEmpty()
  area!: string;

  @IsNotEmpty()
  subArea!: string;
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

  costs!: IRideCosts;

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
