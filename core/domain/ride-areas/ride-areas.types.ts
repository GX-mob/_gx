import { ERideTypes } from "../ride/ride.types";

export interface IRideTypeConfiguration {
  type: ERideTypes;
  available: boolean;
  perKilometer: number;
  perMinute: number;
  kilometerMultipler: number;
  minuteMultipler: number;
  overBusinessTimeKmAdd: number;
  overBusinessTimeMinuteAdd: number;
  /**
   * Minimum value of a ride
   */
  minRideTax: number;
}

export interface IOfferConfig {
  initialRadiusSize: number;
  additionalRadiusSizeByEachIteration: number;
  maxRadiusSize: number;
  finishingRideAcceptableRangeRadius: number;
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
  offerConfig: IOfferConfig;
  ridesTypes: IRideTypeConfiguration[];
  subAreas: { [subArea: string]: IRideAreaConfiguration };
}
