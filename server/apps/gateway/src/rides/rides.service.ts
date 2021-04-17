import { Injectable } from "@nestjs/common";
import { TCreateRideDto } from "@core/interfaces";
import {
  RideRepository,
  RideAreaConfigurationRepository,
} from "@app/repositories";
import { Account } from "@core/domain/account";
import {
  IRide,
  RideCreate,
} from "@core/domain/ride";
import {
  IRideAreaConfiguration,
  IRideTypeConfiguration,
  RideAreas
} from "@core/domain/ride-areas";

@Injectable()
export class RidesService {
  
  private rideAreas!: RideAreas;

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
    const rideAreas = await this.rideAreaConfigurationRepository.model
      .find()
      .lean<IRideAreaConfiguration>();

    this.rideAreas = new RideAreas(rideAreas);
  }

  async getRideByPid(pid: IRide["pid"]) {
    return this.rideRepository.find({ pid });
  }

  async create(user: Account, data: TCreateRideDto) {
    return this.rideRepository.create(new RideCreate(user, this.rideAreas, data));
  }

  /**
   * Returns the rides types and respective prices of the requested area
   * @param area
   * @param subArea
   * @returns {IRideTypeConfiguration} Price list, price for provided ride type or undefined
   */
  getPricesOfRidesType(
    area: string,
    subArea?: string,
  ): IRideTypeConfiguration[] {
    return this.rideAreas.getAreaConfig(area, subArea).ridesTypes;
  }
}
