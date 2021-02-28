import { IUser } from "../../interfaces";
import { IAccountVerification } from "../../interfaces/models/account-verifiations.interface";
import { FederalIDObject } from "../value-objects/federial-id.value-object";

export class UserAccount {
  public setFederalID(value: string) {
    const federalIDObject = new FederalIDObject(value, this.userData.country);

    federalIDObject.validate();

    this.userData.federalID = federalIDObject.value;
  }

  public setAccountVerification(accountVerification: IAccountVerification ) {
    this.userData.accountVerificationId = accountVerification._id;
  }
}