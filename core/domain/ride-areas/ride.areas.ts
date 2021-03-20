import { InvalidRideTypeException, UnsupportedAreaException } from "./ride-areas.exceptions";
import { hasProp } from "../../utils";
import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
} from "./ride-areas.types";
import { ERideTypes } from "../ride/ride.types";

export class RideAreas {
  constructor(private readonly areas: IRideAreaConfiguration[]) {}

  public getAreaConfig(area: string): IRideAreaConfiguration {
    const areaConfig = this.areas.find(
      (areaConfig) => areaConfig.area === area,
    );

    if (!areaConfig) {
      throw new UnsupportedAreaException();
    }

    return areaConfig;
  }

  getPricesForArea(area: string, subArea?: string): IRideTypeConfiguration[] {
    const areaConfig = this.getAreaConfig(area);

    const response =
      subArea && hasProp(areaConfig.subAreas, subArea)
        ? areaConfig.subAreas[subArea]
        : areaConfig.general;

    return response;
  }

  getRidePricesForType(area: string, rideType: ERideTypes, subArea?: string): IRideTypeConfiguration {
    const areaPrices = this.getPricesForArea(area, subArea);

    const rideTypeConfiguration = areaPrices.find(
      (config) => config.type === rideType,
    );

    if (!rideTypeConfiguration) {
      throw new InvalidRideTypeException();
    }

    return rideTypeConfiguration;
  }
}
