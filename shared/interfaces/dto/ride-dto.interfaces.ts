import { IPendencie } from "../models/pendencie.interface";
import {
  IRide,
  IRoute,
  RidePayMethods,
  RideTypes,
} from "../models/ride.interface";

export interface IGetRideInfoDto {
  pid: IRide["pid"];
}

export interface IGetRidePricesDto {
  area: IRide["area"];
  subArea?: IRide["subArea"];
}

export interface ICreateRideDto {
  route: IRoute;
  type: RideTypes;
  payMethod: RidePayMethods;
  country: IRide["country"];
  area: IRide["area"];
  subArea: IRide["subArea"];
}

export interface ICreatedRideDto {
  pid: IRide["pid"];
  costs: IRide["costs"];
  pendencies: IPendencie[];
}
