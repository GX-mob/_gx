import {
  RideInterface,
  RideTypes,
  RidePayMethods,
  RouteInterface,
  RoutePointInterface,
} from "@shared/interfaces";
import {
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsArray,
} from "class-validator";

class Point implements RoutePointInterface {
  @IsArray()
  coord!: [number, number];

  @IsNotEmpty()
  primary!: string;

  @IsNotEmpty()
  secondary!: string;

  @IsNotEmpty()
  district!: string;
}

class Route implements RouteInterface {
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

export class GetRidesPricesParams {
  area!: string;
  subArea?: string;
}

export class CreateRideDto {
  @ValidateNested()
  route!: Route;

  @IsEnum(RideTypes)
  type!: RideTypes;

  @IsEnum(RidePayMethods)
  payMethod!: RidePayMethods;

  @IsNotEmpty()
  country!: RideInterface["country"];

  @IsNotEmpty()
  area!: RideInterface["area"];

  @IsNotEmpty()
  subArea!: RideInterface["subArea"];
}
