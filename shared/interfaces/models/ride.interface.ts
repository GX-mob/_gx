import { IPendencie } from "./pendencie.interface";
import { IUser } from "./user.interface";

export interface IRoutePoint {
  /**
   * Latitude and longitude
   */
  coord: [number, number];
  /**
   * Primary title
   */
  primary: string;
  /**
   * Secondary title
   */
  secondary: string;
  /**
   * Slug name of district
   */
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

export enum RideTypes {
  Normal = 1,
  VIG = 2,
}

export enum RidePayMethods {
  Money = 1,
  CreditCard = 2,
}

export enum RideStatus {
  CREATED,
  RUNNING,
  COMPLETED,
  CANCELED,
}

export interface IRideCosts {
  /**
   * Ride cost, distance + duration
   */
  base: number;
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
  /**
   * Total cost, ride costs + pendencies costs
   */
  total: number;
}

export interface IRide {
  _id: any;
  pid: string;
  voyager: IUser;
  route: IRoute;
  /**
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  type: RideTypes;
  /**
   * * 1 = Money
   * * 2 = Credit card
   */
  payMethod: RidePayMethods;
  /**
   * Ride costs
   */
  costs: IRideCosts;
  country: string;
  area: string;
  subArea: string;
  status: RideStatus;
  driver?: IUser;
  pendencies?: IPendencie[];
}
