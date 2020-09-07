import {
  Ride,
  RideTypes,
  RidePayMethods,
  TRoute,
  TRoutePoint,
} from "@app/database";
import {
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsArray,
} from "class-validator";

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
  country!: Ride["country"];

  @IsNotEmpty()
  area!: Ride["area"];

  @IsNotEmpty()
  subArea!: Ride["subArea"];
}

class Route implements TRoute {
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

class Point implements TRoutePoint {
  @IsArray()
  coord!: [number, number];

  @IsNotEmpty()
  primary!: string;

  @IsNotEmpty()
  secondary!: string;

  @IsNotEmpty()
  district!: string;
}
