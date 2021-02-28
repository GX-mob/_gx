import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IRide } from "@core/interfaces";
import { RideModel, RideDocument } from "../schemas/ride";

export interface RideQueryInterface
  extends Partial<Pick<IRide, "_id" | "pid">> {}
export interface RideUpdateInterface
  extends Partial<Omit<IRide, "_id" | "pid">> {}
export interface RideCreateInterface
  extends Omit<IRide, "_id" | "pid" | "status"> {}

@Injectable()
export class RideRepository extends RepositoryFactory<
  IRide,
  RideDocument,
  {
    Query: RideQueryInterface;
    Update: RideUpdateInterface;
    Create: RideCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, RideModel, {
      namespace: RideRepository.name,
      linkingKeys: ["pid"],
      autoPopulate: ["voyager", "driver", "pendencies"],
    });
  }
}
