import { RideTypes } from "./ride.interface";

export interface IRideTypeConfiguration {
  /**
   * Ride type
   */
  type: RideTypes;
  /**
   * Defines if the ride type is available in the respective area
   */
  available: boolean;
  /**
   * Cost per kilometer
   */
  perKilometer: number;
  /**
   * Cost per minute
   */
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
  longRideConditions: {
    distanceKm: number;
    minutes: number;
  };
  general: IRideTypeConfiguration[];
  subAreas: { [subArea: string]: IRideTypeConfiguration[] };
}
