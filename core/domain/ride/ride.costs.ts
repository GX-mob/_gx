import { utcToZonedTime } from "date-fns-tz";
import { TCalculatedPriceAspect, TRideBasePrices } from "./ride.types";
import { TCreateRideDto } from "../../interfaces";
import { AMOUT_DECIMAL_ADJUST } from "./constants";
import { decimalAdjust } from "../../utils";
import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
  RideAreas,
} from "../ride-areas";

export class RideCosts {
  private rideAreaConfig!: IRideAreaConfiguration;
  private rideTypeConfiguration!: IRideTypeConfiguration;
  private _isBusinessTime!: boolean;

  private durationPrice!: TCalculatedPriceAspect;
  private distancePrice!: TCalculatedPriceAspect;

  constructor(private rideAreas: RideAreas, private ride: TCreateRideDto) {
    this.getAreaConfig();
    this.checkIfIsBusinessTime();
    this.calculateDurationPrice();
    this.calculateDistancePrice();
  }

  private getAreaConfig() {
    const { area, subArea, type } = this.ride;

    this.rideAreaConfig = this.rideAreas.getAreaConfig(area);
    this.rideTypeConfiguration = this.rideAreas.getRidePricesForType(
      area,
      type,
      subArea,
    );
  }

  public toJSON(): TRideBasePrices {
    return {
      duration: this.durationPrice,
      distance: this.distancePrice,
      total: this.durationPrice.total + this.distancePrice.total,
    };
  }

  private checkIfIsBusinessTime() {
    this._isBusinessTime = this.isBusinessTime();
  }

  private isBusinessTime(date: Date = new Date()) {
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

  private calculateDurationPrice() {
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

  private calculateDistancePrice() {
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
      total: decimalAdjust(multipler * distance, AMOUT_DECIMAL_ADJUST),
      aditionalForLongRide: decimalAdjust(
        aditionalForLongRide,
        AMOUT_DECIMAL_ADJUST,
      ),
      aditionalForOutBusinessTime: decimalAdjust(
        aditionalForOutBusinessTime,
        AMOUT_DECIMAL_ADJUST,
      ),
    };
  }
}
