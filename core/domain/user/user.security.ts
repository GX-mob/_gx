import {
  PasswordRequiredException,
  UnchangedPasswordException,
} from "./user.exceptions";
import { UserBase } from "./user.base";
import { checkIfHasContact } from "./user.contact";
import { PasswordObject } from "../value-objects/password.value-object";

export class UserSecurity extends UserBase {
  public enable2FA(userContactTarget: string) {
    this.passwordRequired();

    checkIfHasContact(this.data, userContactTarget);

    this.data["2fa"] = userContactTarget;
  }

  public async disable2FA(rawSentPassword: string) {
    await this.assertPassword(rawSentPassword);

    this.data["2fa"] = "";
  }

  private passwordRequired() {
    if (!this.data.password) {
      throw new PasswordRequiredException();
    }
  }

  public async upsertPassword(newRawPassword: string, currentRawPassword?: string) {
    const newPasswordObject = new PasswordObject(newRawPassword);
    await newPasswordObject.makeHash();

    if (!this.data.password) {
      this.data.password = newPasswordObject.toString("base64");
      return;
    }

    if(!currentRawPassword) {
      throw new PasswordRequiredException();
    }

    const { rightPasswordObject } = await this.assertPassword(currentRawPassword);

    if (newPasswordObject.isEqual(rightPasswordObject.toBuffer())) {
      throw new UnchangedPasswordException();
    }

    this.data.password = rightPasswordObject.toString("base64");
  }

  public async assertPassword(
    rawSentPassword: string,
  ): Promise<{
    leftPasswordObject: PasswordObject;
    rightPasswordObject: PasswordObject;
  }> {
    const leftPasswordObject = new PasswordObject(
      this.data.password as string,
      "base64",
    );
    const rightPasswordObject = new PasswordObject(rawSentPassword);

    await leftPasswordObject.compare(rightPasswordObject);

    if (leftPasswordObject.neededReHash) {
      this.data.password = leftPasswordObject.toString();
    }

    return { leftPasswordObject, rightPasswordObject };
  }
}
