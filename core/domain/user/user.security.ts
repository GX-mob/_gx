import SecurePassword from "secure-password";
import {
  NotOwnContactException,
  PasswordRequiredException,
  UnchangedPasswordException,
  WrongPasswordException,
} from "./user.exceptions";
import { UserBasic } from "./user.basic";
import { hasContact } from "./user.contact";

const securePassword = new SecurePassword();

export class UserSecurity extends UserBasic {
  enable2FA(userContactTarget: string) {
    this.passwordRequired();

    if(!hasContact(this.userData, userContactTarget)){
      throw new NotOwnContactException();
    }

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

  public async upsertPassword(
    currentRawPassword: string,
    newRawPassword: string,
  ) {
    const newPasswordHash = await securePassword.hash(
      Buffer.from(newRawPassword),
    );

    if (!this.userData.password) {
      this.userData.password = newPasswordHash.toString("base64");
      return;
    }

    const currentPassword = this.userData.password;

    await this.assertPassword(currentRawPassword);

    const compareResult = await securePassword.verify(
      newPasswordHash,
      Buffer.from(currentPassword, "base64"),
    );

    if (compareResult === SecurePassword.VALID) {
      throw new UnchangedPasswordException();
    }

    this.userData.password = newPasswordHash.toString("base64");
  }

  public async assertPassword(rawSentPassword: string) {
    const rawSentPasswordBuffer = Buffer.from(rawSentPassword);
    const currentPassword = Buffer.from(
      this.userData.password as string,
      "base64",
    );
    const result = await securePassword.verify(
      rawSentPasswordBuffer,
      currentPassword,
    );

    switch (result) {
      case SecurePassword.VALID:
        return;
      case SecurePassword.VALID_NEEDS_REHASH:
        const newHash = await securePassword.hash(Buffer.from(rawSentPassword));
        this.userData.password = newHash.toString("base64");
        return;
      default:
        throw new WrongPasswordException();
    }
  }
}
