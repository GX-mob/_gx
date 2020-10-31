import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IVehicle } from "@shared/interfaces";
import { VehicleModel } from "../schemas/vehicle";
import { VehicleMetadataModel } from "../schemas/vehicle-metadata";

export interface VehicleQueryInterface
  extends Partial<Pick<IVehicle, "_id" | "plate">> {}
export interface VehicleUpdateInterface
  extends Partial<Omit<IVehicle, "year" | "permissions">> {}
export interface VehicleCreateInterface
  extends Omit<IVehicle, "_id" | "inUse" | "permissions"> {}

@Injectable()
export class VehicleRepository extends RepositoryFactory<
  IVehicle,
  {
    Query: VehicleQueryInterface;
    Update: VehicleUpdateInterface;
    Create: VehicleCreateInterface;
  }
> {
  vehicleMetadataModel = VehicleMetadataModel;
  constructor(private cacheService: CacheService) {
    super(cacheService, VehicleModel, {
      namespace: VehicleRepository.name,
      autoPopulate: ["metadata"],
    });
  }
}
