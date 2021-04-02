import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { ISession, Session } from "@core/domain/session";
import { SessionModel, SessionDocument } from "../schemas/session";

export type TSessionQuery = Partial<Pick<ISession, "_id" | "user">>
export type TSessionUpdate =  Partial<Omit<ISession, "_id" | "user">>
export type TSessionCreate = Omit<ISession, "_id" | "active" | "createdAt">

@Injectable()
export class SessionRepository extends RepositoryFactory<
  ISession,
  SessionDocument,
  TSessionCreate,
  TSessionQuery,
  TSessionUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, SessionModel, {
      namespace: SessionRepository.name,
      autoPopulate: ["user"],
    });
  }

  update(session: Session) {
    return this.updateByQuery({ _id: session.getID() }, session.getUpdatedData());
  }
}
