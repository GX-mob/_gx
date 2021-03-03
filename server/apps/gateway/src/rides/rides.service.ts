import { Injectable } from "@nestjs/common";
import { ICreateRideDto } from "@core/interfaces";
import {
  RideRepository,
  RideAreaConfigurationRepository,
} from "@app/repositories";
import { util } from "@app/helpers";
import { UnsupportedAreaException } from "@core/domain/ride";
import { IUser, User } from "@core/domain/user";
import {
  IRide,
  IRideAreaConfiguration,
  IRideTypeConfiguration,
  RideCreate,
} from "@core/domain/ride";

@Injectable()
export class RidesService {
  readonly areas: IRideAreaConfiguration[] = [];

  constructor(
    private rideRepository: RideRepository,
    private rideAreaConfigurationRepository: RideAreaConfigurationRepository,
  ) {
    this.init();
  }

  private async init() {
    /**
     * Get and store all area and subArea configuration for all rides types and prices in memory
     */
    const prices = await this.rideAreaConfigurationRepository.model
      .find()
      .lean<IRideAreaConfiguration>();

    this.areas.push(...prices);
  }

  async getRideByPid(pid: IRide["pid"]) {
    return this.rideRepository.find({ pid });
  }

  async create(user: User, data: ICreateRideDto) {
    return this.rideRepository.create(new RideCreate(user, this.areas, data));
  }

  /**
   * Returns the rides types and respective prices of the requested area
   * or the price for the respective area for the ride type, if provided a type
   * fallback to $area if not have results for $area.$subArea
   * @param area
   * @param subArea
   * @returns {IRideTypeConfiguration} Price list, price for provided ride type or undefined
   */
  getPricesOfRidesType(
    area: string,
    subArea?: string,
  ): IRideTypeConfiguration[] {
    const areaPrices = this.areas.find(
      (areaConfig) => areaConfig.area === area,
    );

    if (!areaPrices) {
      throw new UnsupportedAreaException();
    }

    const response =
      subArea && util.hasProp(areaPrices.subAreas, subArea)
        ? areaPrices.subAreas[subArea]
        : areaPrices.general;

    return response;
  }
}
