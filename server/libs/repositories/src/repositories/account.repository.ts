import { Injectable } from "@nestjs/common";
import { IAccount } from "@core/domain/account/account.types";
import { AccountBase } from "@core/domain/account/account.base";
import { CacheService } from "@app/cache";
import { RepositoryFactory } from "../repository.factory";
import { AccountModel, AccountDocument } from "../schemas/account";
import { ContactObject } from "@core/domain/value-objects/contact.value-object";
import { TAccountCreate, AccountCreate } from "@core/domain/account";

export type TAccountQuery = Partial<
  Pick<
    IAccount,
    "_id" | "pid" | "primaryEmail" | "primaryMobilePhone" | "federalID"
  >
>;
export type TAccountUpdate = Partial<Omit<IAccount, "_id" | "pid">>;

@Injectable()
export class UserRepository extends RepositoryFactory<
  IAccount,
  AccountDocument,
  TAccountCreate,
  TAccountQuery,
  TAccountUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, AccountModel, {
      namespace: UserRepository.name,
      linkingKeys: ["pid", "primaryEmail", "primaryMobilePhone"],
      autoPopulate: ["accountVerifications"]
    });
  }

  public update(user: AccountBase) {
    return super.updateByQuery({ _id: user.getID() }, user.getUpdatedData());
  }

  public async create(user: AccountCreate) {
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
