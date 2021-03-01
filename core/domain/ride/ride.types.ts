
import { IUser } from "../user";

export interface IRoutePoint {
  coord: [number, number];
  primary: string;
  secondary: string;
  district: string;
}

export interface IRoute {
  start: IRoutePoint;
  waypoints?: IRoutePoint[];
  end: IRoutePoint;
  path: string;
  distance: number;
  duration: number;
}

export enum ERideTypes {
  Normal = "normal",
  VIG = "vig",
}

export enum ERidePayMethods {
  Money = "money",
  CreditCard = "credit-card",
}

export enum ERideStatus {
  Created = "created",
  Running = "running",
  Completed = "completed",
  Canceled = "canceled",
}

export interface IRideCosts {
  distance: {
    total: number;
    aditionalForLongRide: number;
    aditionalForOutBusinessTime: number;
  };
  duration: {
    total: number;
    aditionalForLongRide: number;
    aditionalForOutBusinessTime: number;
  };
  total: number;
}

export interface IRide {
  _id: any;
  pid: string;
  voyager: IUser;
  route: IRoute;
  type: ERideTypes;
  payMethod: ERidePayMethods;
  costs: IRideCosts;
  country: string;
  area: string;
  subArea: string;
  status: ERideStatus;
  driver?: IUser;
}

export interface IRideTypeConfiguration {
  type: ERideTypes;
  available: boolean;
  perKilometer: number;
  perMinute: number;
  kilometerMultipler: number;
  minuteMultipler: number;
  overBusinessTimeKmAdd: number;
  overBusinessTimeMinuteAdd: number;
}

export interface IRideAreaConfiguration {
  area: string;
  currency: string;
  timezone: string;
  businessTimeHourStart: number;
  businessTimeHourEnd: number;
  longRideConditions: {
    distanceKm: number;
    minutes: number;
  };
  general: IRideTypeConfiguration[];
  subAreas: { [subArea: string]: IRideTypeConfiguration[] };
}

export type TCalculatedPriceAspect = {
  total: number;
  aditionalForLongRide: number;
  aditionalForOutBusinessTime: number;
};

export type TRideBasePrices = {
  duration: TCalculatedPriceAspect;
  distance: TCalculatedPriceAspect;
  total: number;
};