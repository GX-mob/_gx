import { CacheService } from "@app/cache";
import { AccountCreate, TAccountCreate } from "@core/domain/account";
import { AccountBase } from "@core/domain/account/account.base";
import { IAccount } from "@core/domain/account/account.types";
import {
  ContactObject,
  EContactTypes
} from "@core/domain/value-objects/contact.value-object";
import { Injectable } from "@nestjs/common";
import { RepositoryFactory } from "../repository.factory";
import { AccountDocument, AccountModel } from "../schemas/account";

export type TAccountQuery = Partial<
  Pick<
    IAccount,
    "_id" | "pid" | "primaryEmail" | "primaryMobilePhone" | "federalID"
  >
>;
export type TAccountUpdate = Partial<Omit<IAccount, "_id" | "pid">>;

@Injectable()
export class AccountRepository extends RepositoryFactory<
  IAccount,
  AccountDocument,
  TAccountCreate,
  TAccountQuery,
  TAccountUpdate
> {
  constructor(cacheService: CacheService) {
    super(cacheService, AccountModel, {
      namespace: AccountRepository.name,
      linkingKeys: ["pid", "primaryEmail", "primaryMobilePhone"],
      autoPopulate: ["accountVerifications"],
    });
  }

  public update(user: AccountBase) {
    return super.updateByQuery({ _id: user.getID() }, user.getUpdatedData());
  }

  public async create(user: AccountCreate) {
    return this.insert(user.getCreationData());
  }

  public findByContact(contact: ContactObject) {
    switch (contact.getType()) {
      case EContactTypes.Email:
        return this.findByEmail(contact.value);
      case EContactTypes.Phone:
        return this.findByPhone(contact.value);
    }
  }

  public findByEmail(email: string) {
    return this.find({ primaryEmail: email });
  }

  public findByPhone(phone: string) {
    return this.find({ primaryMobilePhone: phone });
  }
}
