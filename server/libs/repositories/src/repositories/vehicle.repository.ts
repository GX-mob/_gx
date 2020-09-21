import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { VehicleInterface } from "@shared/interfaces";
import { VehicleModel } from "../models/vehicle";

export interface VehicleQueryInterface
  extends Partial<Pick<VehicleInterface, "_id" | "plate">> {}
export interface VehicleUpdateInterface
  extends Partial<Omit<VehicleInterface, "year" | "permissions">> {}
export interface VehicleCreateInterface
  extends Omit<VehicleInterface, "_id" | "inUse" | "permissions"> {}

@Injectable()
export class VehicleRepository extends RepositoryFactory<
  VehicleInterface,
  {
    Query: VehicleQueryInterface;
    Update: VehicleUpdateInterface;
    Create: VehicleCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, VehicleModel, {
      namespace: "vehicles",
      autoPopulate: ["metadata"],
    });
  }
}
