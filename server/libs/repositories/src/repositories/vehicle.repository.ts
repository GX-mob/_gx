import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IVehicle, TVehicleCreate } from "@core/domain/vehicle";
import { VehicleModel, VehicleDocument } from "../schemas/vehicle";
import { VehicleMetadataModel } from "../schemas/vehicle-metadata";

export type TVehicleQuery = Partial<Pick<IVehicle, "_id" | "plate">>;
export type TVehicleUpdate = Partial<
  Omit<IVehicle, "year" | "permissions">
>;
@Injectable()
export class VehicleRepository extends RepositoryFactory<
  IVehicle,
  VehicleDocument,
  TVehicleCreate,
  TVehicleQuery,
  TVehicleUpdate
> {
  vehicleMetadataModel = VehicleMetadataModel;
  constructor(cacheService: CacheService) {
    super(cacheService, VehicleModel, {
      namespace: VehicleRepository.name,
      autoPopulate: ["metadata"],
    });
  }
}
