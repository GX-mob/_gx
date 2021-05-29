import { IAccount } from "../account";

export interface IRoutePoint {
  coord: [number, number];
  primary: string;
  secondary: string;
  district: string;
}

export interface IRoute {
  start: IRoutePoint;
  waypoints: IRoutePoint[];
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
  Cash = "cash",
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
  voyager: IAccount;
  route: IRoute;
  type: ERideTypes;
  payMethod: ERidePayMethods;
  costs: IRideCosts;
  country: string;
  area: string;
  subArea: string;
  status: ERideStatus;
  driver?: IAccount;
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

export interface IRideCreate
  extends Pick<IRide, "country" | "area" | "subArea"> {
  route: IRoute;
  type: ERideTypes;
  payMethod: ERidePayMethods;
}

export interface IRideOffer {
  pid: string;
}

export type TRideCostDescriptors = Pick<
  IRide,
  "type" | "area" | "subArea" | "route"
>;
