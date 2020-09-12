import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { Ride, RideModel } from "../models/ride";

export interface RideQueryInterface extends Partial<Ride> {}
export interface RideUpdateInterface extends Partial<Ride> {}
export interface RideCreateInterface
  extends Omit<Ride, "_id" | "pid" | "status"> {}

@Injectable()
export class RideRepository extends RepositoryFactory<
  Ride,
  {
    Query: RideQueryInterface;
    Update: RideUpdateInterface;
    Create: RideCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, RideModel, {
      namespace: "rides",
      linkingKeys: ["pid"],
      autoPopulate: ["voyager", "driver", "pendencies"],
    });
  }
}
