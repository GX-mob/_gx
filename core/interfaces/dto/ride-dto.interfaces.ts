import {
  IRide,
  IRoute,
  ERidePayMethods,
  ERideTypes,
} from "../../domain/ride";

export interface IGetRideInfoDto {
  pid: IRide["pid"];
}

export interface IGetRidePricesDto {
  area: IRide["area"];
  subArea?: IRide["subArea"];
}

export interface ICreateRideDto {
  route: IRoute;
  type: ERideTypes;
  payMethod: ERidePayMethods;
  country: IRide["country"];
  area: IRide["area"];
  subArea: IRide["subArea"];
}

export interface ICreatedRideDto {
  pid: IRide["pid"];
  costs: IRide["costs"];
}
