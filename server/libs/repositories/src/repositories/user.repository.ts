import { Injectable } from "@nestjs/common";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { IUser } from "@core/interfaces";
import { UserModel, UserDocument } from "../schemas/user";
import { UserBasic } from "@core/domain/user/user.basic";

export interface UserQueryInterface
  extends Partial<Pick<IUser, "_id" | "pid" | "primaryEmail" | "primaryMobilePhone" | "cpf">> {}
export interface UserUpdateInterface
  extends Partial<Omit<IUser, "_id" | "pid">> {}
export interface UserCreateInterface
  extends Omit<
    IUser,
    "_id" | "pid" | "averageEvaluation" | "roles"
  > {}

@Injectable()
export class UserRepository extends RepositoryFactory<
  IUser,
  UserDocument,
  {
    Query: UserQueryInterface;
    Update: UserUpdateInterface;
    Create: UserCreateInterface;
  }
> {
  constructor(private cacheService: CacheService) {
    super(cacheService, UserModel, {
      namespace: UserRepository.name,
      linkingKeys: ["pid", "primaryEmail", "primaryMobilePhone", "cpf"],
    });
  }

  public update(user: UserBasic){
    return super.updateByQuery({ _id: user.getID() } , user.getUpdatedData());
  }
}
