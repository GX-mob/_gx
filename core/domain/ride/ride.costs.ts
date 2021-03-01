import { utcToZonedTime } from "date-fns-tz";
import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
  TCalculatedPriceAspect,
  TRideBasePrices,
} from "./ride.types";
import { ICreateRideDto } from "../../interfaces";
import {
  UnsupportedAreaException,
  InvalidRideTypeException,
} from "./ride.exceptions";
import { AMOUT_DECIMAL_ADJUST } from "./constants";

// TODO Move utils to core
declare var util: any;

export class RideCosts {
  private rideAreaConfig: IRideAreaConfiguration;
  private rideTypeConfiguration: IRideTypeConfiguration;
  private _isBusinessTime!: boolean;

  private durationPrice!: TCalculatedPriceAspect;
  private distancePrice!: TCalculatedPriceAspect;

  constructor(
    rideAreasConfig: IRideAreaConfiguration[],
    private ride: ICreateRideDto,
  ) {

    const rideAreaConfig = rideAreasConfig.find( config => config.area === ride.area );

    if (!rideAreaConfig) throw new UnsupportedAreaException();

    this.rideAreaConfig = rideAreaConfig;

    const { subArea, type } = ride;

    const rideTypesConfiguration: IRideTypeConfiguration[] =
      subArea && subArea in rideAreaConfig.subAreas
        ? rideAreaConfig.subAreas[subArea]
        : rideAreaConfig.general;

    const rideTypeConfiguration = rideTypesConfiguration.find(
      (config) => config.type === type,
    );

    if (!rideTypeConfiguration) {
      throw new InvalidRideTypeException();
    }

    this.rideTypeConfiguration = rideTypeConfiguration;

    this._isBusinessTime = this.isBusinessTime();

    this.calculateDurationPrice();
    this.calculateDistancePrice();
  }

  public toJSON(): TRideBasePrices {
    return {
      duration: this.durationPrice,
      distance: this.distancePrice,
      total: this.durationPrice.total + this.distancePrice.total,
    };
  }

  public isBusinessTime(date: Date = new Date()) {
    const zonedDate = utcToZonedTime(date, this.rideAreaConfig.timezone);
    const hour = zonedDate.getHours();
    const isSunday = zonedDate.getDay() === 0;

    if (isSunday) {
      return false;
    }

    return (
      hour >= this.rideAreaConfig.businessTimeHourStart &&
      hour <= this.rideAreaConfig.businessTimeHourEnd
    );
  }

  calculateDurationPrice() {
    /**
     * Default price multiplier
     */
    const {
      route: { duration },
    } = this.ride;
    const prices = this.rideTypeConfiguration;
    let multipler = prices.perMinute;
    let aditionalForLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional multipler to long rides
     */
    if (duration > this.rideAreaConfig.longRideConditions.minutes) {
      multipler += prices.minuteMultipler;
      aditionalForLongRide = duration * prices.minuteMultipler;
    }

    /**
     * Aditional fare to non business time rides
     */
    if (!this._isBusinessTime) {
      multipler += prices.overBusinessTimeMinuteAdd;
      aditionalForOutBusinessTime = duration * prices.minuteMultipler;
    }

    this.durationPrice = {
      total: duration * multipler,
      aditionalForLongRide,
      aditionalForOutBusinessTime,
    };
  }

  calculateDistancePrice() {
    /**
     * Default price multiplier
     */
    const {
      route: { distance },
    } = this.ride;
    const prices = this.rideTypeConfiguration;
    let multipler = prices.perKilometer;
    let aditionalForLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional fare multiplier for long rides
     */
    if (distance > this.rideAreaConfig.longRideConditions.distanceKm) {
      multipler += prices.overBusinessTimeKmAdd;
      aditionalForLongRide = distance * prices.kilometerMultipler;
    }

    /**
     * Aditional fare to non business time rides
     */
    if (!this._isBusinessTime) {
      multipler += prices.overBusinessTimeKmAdd;
      aditionalForOutBusinessTime = distance * prices.overBusinessTimeKmAdd;
    }

    this.distancePrice = {
      total: util.decimalAdjust(multipler * distance, AMOUT_DECIMAL_ADJUST),
      aditionalForLongRide: util.decimalAdjust(
        aditionalForLongRide,
        AMOUT_DECIMAL_ADJUST,
      ),
      aditionalForOutBusinessTime: util.decimalAdjust(
        aditionalForOutBusinessTime,
        AMOUT_DECIMAL_ADJUST,
      ),
    };
  }
}
