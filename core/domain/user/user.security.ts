import {
  PasswordRequiredException,
  UnchangedPasswordException,
} from "./user.exceptions";
import { UserBasic } from "./user.basic";
import { checkIfHasContact } from "./user.contact";
import { PasswordObject } from "../value-objects/password.value-object";

export class UserSecurity extends UserBasic {
  enable2FA(userContactTarget: string) {
    this.passwordRequired();

    checkIfHasContact(this.userData, userContactTarget);

    this.userData["2fa"] = userContactTarget;
  }

  public async disable2FA(rawSentPassword: string) {
    await this.assertPassword(rawSentPassword);

    this.userData["2fa"] = "";
  }

  private passwordRequired() {
    if (!this.userData.password) {
      throw new PasswordRequiredException();
    }
  }

  public async upsertPassword(currentRawPassword: string, newRawPassword: string) {
    const newPasswordObject = new PasswordObject(newRawPassword);
    await newPasswordObject.makeHash();

    if (!this.userData.password) {
      this.userData.password = newPasswordObject.toString("base64");
      return;
    }

    const { rightPasswordObject } = await this.assertPassword(currentRawPassword);

    if (newPasswordObject.isEqual(rightPasswordObject.toBuffer())) {
      throw new UnchangedPasswordException();
    }

    this.userData.password = rightPasswordObject.toString("base64");
  }

  public async assertPassword(
    rawSentPassword: string,
  ): Promise<{
    leftPasswordObject: PasswordObject;
    rightPasswordObject: PasswordObject;
  }> {
    const leftPasswordObject = new PasswordObject(
      this.userData.password as string,
      "base64",
    );
    const rightPasswordObject = new PasswordObject(rawSentPassword);

    await leftPasswordObject.compare(rightPasswordObject);

    if (leftPasswordObject.neededReHash) {
      this.userData.password = leftPasswordObject.toString();
    }

    return { leftPasswordObject, rightPasswordObject };
  }
}
