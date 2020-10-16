import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { IPendencie } from "@shared/interfaces";
import { PendencieModel } from "../models/pendencie";

export interface PendencieQueryInterface
  extends Partial<Pick<IPendencie, "affected" | "issuer" | "_id" | "ride">> {}
export interface PendencieUpdateInterface
  extends Pick<IPendencie, "resolved"> {}
export interface PendencieCreateInterface
  extends Omit<IPendencie, "_id" | "resolved"> {}

@Injectable()
export class PendencieRepository extends RepositoryFactory<
  IPendencie,
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
