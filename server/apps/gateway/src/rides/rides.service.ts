import { Injectable } from "@nestjs/common";
import { utcToZonedTime } from "date-fns-tz";
import {
  IUser,
  ICreateRideDto,
  IRide,
  IRideAreaConfiguration,
  IRideTypeConfiguration,
} from "@shared/interfaces";
import { RepositoryService, RideRepository } from "@app/repositories";
import { util } from "@app/helpers";
import { CreateRideDto } from "./rides.dto";
import {
  BUSINESS_TIME_HOURS,
  AMOUT_DECIMAL_ADJUST,
  LONG_RIDE,
} from "../constants";

type CalculatedPriceAspect = {
  total: number;
  aditionalForLongRide: number;
  aditionalForOutBusinessTime: number;
};

@Injectable()
export class RidesService {
  readonly areas: { [area: string]: IRideAreaConfiguration } = {};

  constructor(
    private repositoryService: RepositoryService,
    private rideRepository: RideRepository,
  ) {
    this.init();
  }

  private async init() {
    const { rideAreaConfigurationModel } = this.repositoryService;

    /**
     * Get and store all rides types and prices
     */
    const prices = await rideAreaConfigurationModel.find().lean();

    if (!prices.length) {
      // throw new Error("Empty rides types list");
    }

    prices.forEach((price) => {
      this.areas[price.area] = price;
    });

    /**
     * Watch prices update
    

    rideAreaConfigurationModel.watch().on("change", (data) => {
      switch (data.operationType) {
        case "update":
        case "insert":
          const { fullDocument } = data;
          this.areas[fullDocument.area] = fullDocument;
          break;
      }
    });
    */
  }

  async getRideByPid(pid: IRide["pid"]) {
    return this.rideRepository.get({ pid });
  }

  async create(userId: IUser["_id"], data: ICreateRideDto) {
    /**
     * Get user pendencies
     */
    const { pendencieModel } = this.repositoryService;
    const pendencies = await pendencieModel.find({ issuer: userId });
    const { route, type, payMethod, country, area, subArea } = data;

    /**
     * Calculate rides costs
     */
    const rideCosts = this.getRideCosts(data);
    const base = rideCosts.duration.total + rideCosts.distance.total;
    const total = pendencies.reduce((currentAmount, pendencie) => {
      return currentAmount + pendencie.amount;
    }, base);

    const costs = { ...rideCosts, base, total };

    return this.rideRepository.create({
      voyager: userId,
      route,
      type,
      pendencies,
      payMethod,
      country,
      area,
      subArea,
      costs,
    });
  }

  /**
   * Returns the rides types and respective prices of the requested area
   * or the price for the respective area for the ride type, if provided a type
   * fallback to $area if not have results for $area.$subArea
   * @param area
   * @param subArea
   * @returns {PriceDetail[] | PriceDetail | undefined} Price list, price for provided ride type or undefined
   */
  getRideStatusPrice<T extends IRide["type"]>(
    area: string,
    subArea?: string,
    rideType?: T,
  ): IRideTypeConfiguration | IRideTypeConfiguration[] | undefined {
    if (!util.hasProp(this.areas, area) || !this.areas[area]) {
      return;
    }

    const areaPrices = this.areas[area];

    const response =
      subArea && areaPrices.subAreas[subArea]
        ? areaPrices.subAreas[subArea]
        : areaPrices.general;

    if (typeof rideType !== "undefined") {
      return response.find((price) => price.type === rideType);
    }

    return response;
  }

  getRideCosts(request: CreateRideDto) {
    const { type, area, subArea } = request;

    /**
     * The costs of ride type
     */
    const timezone = this.areas[area].timezone;
    const costs = this.getRideStatusPrice(
      area,
      subArea,
      type,
    ) as IRideTypeConfiguration;
    const isBusinessTime = this.isBusinessTime(timezone);

    const duration = this.durationPrice(
      request.route.duration,
      costs,
      isBusinessTime,
    );
    const distance = this.distancePrice(
      request.route.distance,
      costs,
      isBusinessTime,
    );

    return { duration, distance };
  }

  isBusinessTime(timezone: string, date: Date = new Date()) {
    const zonedDate = utcToZonedTime(date, timezone);
    const hour = zonedDate.getHours();
    const isSunday = zonedDate.getDay() === 0;

    if (isSunday) {
      return false;
    }

    return hour >= BUSINESS_TIME_HOURS.START && hour <= BUSINESS_TIME_HOURS.END;
  }

  /**
   *
   * @param duration In minutes
   * @param price Fares of ride type
   * @param isBusinessTime
   */
  durationPrice(
    duration: number,
    price: IRideTypeConfiguration,
    isBusinessTime: boolean,
  ): CalculatedPriceAspect {
    /**
     * Default price multiplier
     */
    let multipler = price.perMinute;
    let aditionalForLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional multipler to long rides
     */
    if (duration > LONG_RIDE.MINUTES) {
      multipler += price.minuteMultipler;
      aditionalForLongRide = duration * price.minuteMultipler;
    }

    /**
     * Aditional fare to non business time rides
     */
    if (!isBusinessTime) {
      multipler += price.overBusinessTimeMinuteAdd;
      aditionalForOutBusinessTime = duration * price.minuteMultipler;
    }

    return {
      total: duration * multipler,
      aditionalForLongRide,
      aditionalForOutBusinessTime,
    };
  }

  /**
   *
   * @param distance in KM
   * @param price Fares of ride type
   * @param isBusinessTime
   */
  distancePrice(
    distance: number,
    price: IRideTypeConfiguration,
    isBusinessTime: boolean,
  ): CalculatedPriceAspect {
    /**
     * Default price multiplier
     */
    let multipler = price.perKilometer;
    let aditionalForLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional fare multiplier for long rides
     */
    if (distance > LONG_RIDE.DISTANCE_KM) {
      multipler += price.overBusinessTimeKmAdd;
      aditionalForLongRide = distance * price.kilometerMultipler;
    }

    /**
     * Aditional fare to non business time rides
     */
    if (!isBusinessTime) {
      multipler += price.overBusinessTimeKmAdd;
      aditionalForOutBusinessTime = distance * price.overBusinessTimeKmAdd;
    }

    return {
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
