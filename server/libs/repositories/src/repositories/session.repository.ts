import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { SessionInterface as Session } from "@shared/interfaces";
import { SessionModel } from "../models/session";

export interface SessionQueryInterface
  extends Partial<Pick<Session, "_id" | "user">> {}
export interface SessionUpdateInterface
  extends Partial<Omit<Session, "_id" | "user">> {}
export interface SessionCreateInterface
  extends Omit<Session, "_id" | "active" | "createdAt"> {}

@Injectable()
export class SessionRepository extends RepositoryFactory<
  Session,
  {
    Query: SessionQueryInterface;
    Update: SessionUpdateInterface;
    Create: SessionCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, SessionModel, {
      namespace: "sessions",
      autoPopulate: ["user"],
    });
  }
}
