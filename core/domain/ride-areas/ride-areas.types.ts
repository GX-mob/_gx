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
