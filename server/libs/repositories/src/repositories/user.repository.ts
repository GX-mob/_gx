import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository-factory";
import { User, UserModel } from "../models/user";

export interface UserQueryInterface
  extends Partial<Pick<User, "pid" | "phones" | "emails" | "cpf">> {}
export interface UserUpdateInterface
  extends Partial<Omit<User, "_id" | "pid">> {}
export interface UserCreateInterface
  extends Omit<
    User,
    "_id" | "pid" | "averageEvaluation" | "emails" | "roles"
  > {}

@Injectable()
export class UserRepository extends RepositoryFactory<
  User,
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
