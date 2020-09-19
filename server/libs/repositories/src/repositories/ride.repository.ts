import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { RideInterface as Ride } from "@shared/interfaces";
import { RideModel } from "../models/ride";

export interface RideQueryInterface
  extends Partial<Pick<Ride, "_id" | "pid">> {}
export interface RideUpdateInterface
  extends Partial<Omit<Ride, "_id" | "pid">> {}
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
