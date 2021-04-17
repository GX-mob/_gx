import { DomainBase } from "../base-classes/domain-base";
import { IAccount } from "./account.types";

export class AccountBase extends DomainBase<IAccount> {
  constructor(protected data: IAccount) {
    super(data);
  }

  validate() {}
}
