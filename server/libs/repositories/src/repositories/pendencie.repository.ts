import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { PendencieInterface as Pendencie } from "@shared/interfaces";
import { PendencieModel } from "../models/pendencie";

export interface PendencieQueryInterface
  extends Partial<Pick<Pendencie, "affected" | "issuer" | "_id" | "ride">> {}
export interface PendencieUpdateInterface extends Pick<Pendencie, "resolved"> {}
export interface PendencieCreateInterface
  extends Omit<Pendencie, "_id" | "resolved"> {}

@Injectable()
export class PendencieRepository extends RepositoryFactory<
  Pendencie,
  {
    Query: PendencieQueryInterface;
    Update: PendencieUpdateInterface;
    Create: PendencieCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, PendencieModel, {
      namespace: "pendencies",
      linkingKeys: ["issuer", "affected"],
    });
  }
}
