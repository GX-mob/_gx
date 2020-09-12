import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { Pendencie, PendencieModel } from "../models/pendencie";

export interface PendencieQueryInterface extends Partial<Pendencie> {}
export interface PendencieUpdateInterface extends Partial<Pendencie> {}
export interface PendencieCreateInterface extends Omit<Pendencie, "resolved"> {}

@Injectable()
export class PendencieRepository extends RepositoryFactory<
  Pendencie,
  {
    Query: PendencieQueryInterface;
    Update: PendencieUpdateInterface;
    Create: Omit<Pendencie, "resolved">;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, PendencieModel, {
      namespace: "pendencies",
      linkingKeys: ["issuer", "affected"],
    });
  }
}
