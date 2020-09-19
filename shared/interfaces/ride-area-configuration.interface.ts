import { RideTypes } from "./ride.interface";

export interface RideTypeConfigurationInterface {
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

export interface RideAreaConfigurationInterface {
  area: string;
  currency: string;
  timezone: string;
  general: RideTypeConfigurationInterface[];
  subAreas: { [subArea: string]: RideTypeConfigurationInterface[] };
}
