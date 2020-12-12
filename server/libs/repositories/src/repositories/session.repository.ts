import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { ISession } from "@shared/interfaces";
import { SessionModel, SessionDocument } from "../schemas/session";

export interface SessionQueryInterface
  extends Partial<Pick<ISession, "_id" | "user">> {}
export interface SessionUpdateInterface
  extends Partial<Omit<ISession, "_id" | "user">> {}
export interface SessionCreateInterface
  extends Omit<ISession, "_id" | "active" | "createdAt"> {}

@Injectable()
export class SessionRepository extends RepositoryFactory<
  ISession,
  SessionDocument,
  {
    Query: SessionQueryInterface;
    Update: SessionUpdateInterface;
    Create: SessionCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, SessionModel, {
      namespace: SessionRepository.name,
      autoPopulate: ["user"],
    });
  }
}
