import {
  IRide,
  RideTypes,
  RidePayMethods,
  IRoute,
  IRoutePoint,
  IGetRideInfoDto,
  IGetRidePricesDto,
  ICreateRideDto,
  ICreatedRideDto,
  IPendencie,
} from "@shared/interfaces";
import {
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsArray,
} from "class-validator";

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

export class CreatedRideDto implements ICreatedRideDto {
  pid!: IRide["pid"];
  costs!: IRide["costs"];
  pendencies!: IPendencie[];

  constructor(ride: ICreatedRideDto) {
    Object.assign(this, ride);
  }
}
