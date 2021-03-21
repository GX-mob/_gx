import { DomainBase } from "../base-classes/domain-base";
import { IUser } from "./user.types";

export class UserBase extends DomainBase<IUser> {
  constructor(protected data: IUser) {
    super(data);
  }

  validate() {}
}
