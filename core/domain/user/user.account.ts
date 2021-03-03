import { IAccountVerification } from "../../interfaces/models/account-verifications.interface";
import { FederalIDObject } from "../value-objects/federial-id.value-object";
import { UserBasic } from "./user.basic";

export class UserAccount extends UserBasic {
  public setFederalID(value: string) {
    const federalIDObject = new FederalIDObject(value, this.userData.country);
    this.userData.federalID = federalIDObject.value;
  }

  public setAccountVerification(accountVerification: IAccountVerification) {
    //this.userData.accountVerifications.push(accountVerification._id);
  }
}
