import { Verification } from "../verification";
import { FederalIDObject } from "../value-objects/federial-id.value-object";
import { UserBase } from "./user.base";

export class UserAccount extends UserBase {
  public setFederalID(value: string) {
    const federalIDObject = new FederalIDObject(value, this.data.country);
    this.data.federalID = federalIDObject.value;
  }

  public setAccountVerification(verification: Verification) {
    this.data.accountVerifications.push(verification.getID());
  }
}
