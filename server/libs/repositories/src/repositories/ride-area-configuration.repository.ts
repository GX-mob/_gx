import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IRideAreaConfiguration } from "@core/interfaces";
import {
  RideAreaConfigurationModel,
  RideAreaConfigurationDocument,
} from "../schemas/ride-area-configuration";

export type TRideAreaConfigurationQuery = Partial<
  Pick<IRideAreaConfiguration, "area">
>;
export type TRideAreaConfigurationUpdate = Pick<
  IRideAreaConfiguration,
  "general" | "longRideConditions" | "subAreas"
>;
export type TRideAreaConfigurationCreate = Omit<IRideAreaConfiguration, "_id">;

@Injectable()
export class RideAreaConfigurationRepository extends RepositoryFactory<
  IRideAreaConfiguration,
  RideAreaConfigurationDocument,
  TRideAreaConfigurationCreate,
  TRideAreaConfigurationQuery,
  TRideAreaConfigurationUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, RideAreaConfigurationModel, {
      namespace: RideAreaConfigurationRepository.name,
    });
  }
}
