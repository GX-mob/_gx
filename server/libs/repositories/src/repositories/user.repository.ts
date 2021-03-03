import { Injectable } from "@nestjs/common";
import { IUser } from "@core/domain/user/user.types";
import { UserBasic } from "@core/domain/user/user.basic";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { UserModel, UserDocument } from "../schemas/user";
import { ContactObject } from "@core/domain/value-objects/contact.value-object";
import { TUserCreate, UserCreate } from "@core/domain/user";

export type TUserQuery = Partial<
  Pick<
    IUser,
    "_id" | "pid" | "primaryEmail" | "primaryMobilePhone" | "federalID"
  >
>;
export type TUserUpdate = Partial<Omit<IUser, "_id" | "pid">>;

@Injectable()
export class UserRepository extends RepositoryFactory<
  IUser,
  UserDocument,
  TUserCreate,
  TUserQuery,
  TUserUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, UserModel, {
      namespace: UserRepository.name,
      linkingKeys: ["pid", "primaryEmail", "primaryMobilePhone"],
    });
  }

  public update(user: UserBasic) {
    return super.updateByQuery({ _id: user.getID() }, user.getUpdatedData());
  }

  public async create(user: UserCreate) {
    return this.insert(user.getCreationData());
  }

  public findByContact(contact: ContactObject) {
    switch(contact.getType()){
      case "email":
        return this.findByEmail(contact.value);
      case "phone":
        return this.findByPhone(contact.value);
    }
  }

  public findByEmail(email: string) {
    return this.find({ primaryEmail: email })
  }

  public findByPhone(phone: string) {
    return this.find({ primaryMobilePhone: phone })
  }
}
