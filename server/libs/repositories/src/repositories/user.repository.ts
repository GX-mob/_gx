import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { IUser } from "@shared/interfaces";
import { UserModel } from "../models/user";

export interface UserQueryInterface
  extends Partial<Pick<IUser, "_id" | "pid" | "phones" | "emails" | "cpf">> {}
export interface UserUpdateInterface
  extends Partial<Omit<IUser, "_id" | "pid">> {}
export interface UserCreateInterface
  extends Omit<
    IUser,
    "_id" | "pid" | "averageEvaluation" | "emails" | "roles"
  > {}

@Injectable()
export class UserRepository extends RepositoryFactory<
  IUser,
  {
    Query: UserQueryInterface;
    Update: UserUpdateInterface;
    Create: UserCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, UserModel, {
      namespace: "users",
      linkingKeys: ["pid", "phones", "emails", "cpf"],
    });
  }
}
