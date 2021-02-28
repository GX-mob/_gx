import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IPendencie } from "@core/interfaces";
import { PendencieModel, PendencieDocument } from "../schemas/pendencie";

export interface PendencieQueryInterface
  extends Partial<Pick<IPendencie, "affected" | "issuer" | "_id" | "ride">> {}
export interface PendencieUpdateInterface
  extends Pick<IPendencie, "resolved"> {}
export interface PendencieCreateInterface
  extends Omit<IPendencie, "_id" | "resolved"> {}

@Injectable()
export class PendencieRepository extends RepositoryFactory<
  IPendencie,
  PendencieDocument,
  {
    Query: PendencieQueryInterface;
    Update: PendencieUpdateInterface;
    Create: PendencieCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, PendencieModel, {
      namespace: PendencieRepository.name,
      linkingKeys: ["issuer", "affected"],
    });
  }
}
