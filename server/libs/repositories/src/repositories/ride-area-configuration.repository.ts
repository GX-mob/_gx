import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IRideAreaConfiguration } from "@core/interfaces";
import {
  RideAreaConfigurationModel,
  RideAreaConfigurationDocument,
} from "../schemas/ride-area-configuration";

export interface IRideAreaConfigurationQuery
  extends Partial<Pick<IRideAreaConfiguration, "area">> {}
export interface IRideAreaConfigurationUpdate
  extends Pick<
    IRideAreaConfiguration,
    "general" | "longRideConditions" | "subAreas"
  > {}
export interface IRideAreaConfigurationCreate
  extends Omit<IRideAreaConfiguration, "_id"> {}

@Injectable()
export class RideAreaConfigurationRepository extends RepositoryFactory<
  IRideAreaConfiguration,
  RideAreaConfigurationDocument,
  {
    Query: IRideAreaConfigurationQuery;
    Update: IRideAreaConfigurationUpdate;
    Create: IRideAreaConfigurationCreate;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, RideAreaConfigurationModel, {
      namespace: RideAreaConfigurationRepository.name,
    });
  }
}
