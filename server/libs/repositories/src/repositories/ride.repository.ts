import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IRide } from "@core/domain/ride";
import { RideModel, RideDocument } from "../schemas/ride";
import { RideCreate, TRideCreate } from "@core/domain/ride"

export type TRideQuery = Partial<Pick<IRide, "_id" | "pid">>;
export type TRideUpdate = Partial<Omit<IRide, "_id" | "pid">>;
//export type TRideCreate = Omit<IRide, "_id" | "pid" | "status">;

@Injectable()
export class RideRepository extends RepositoryFactory<
  IRide,
  RideDocument,
  TRideCreate,
  TRideQuery,
  TRideUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, RideModel, {
      namespace: RideRepository.name,
      linkingKeys: ["pid"],
      autoPopulate: ["voyager", "driver"],
    });
  }

  public create(ride: RideCreate): Promise<IRide> {
    return super.insert( ride.toJSON() )
  }
}
