import { AccountBase } from "./account.base";

export class AccountProfile extends AccountBase {
  // @TODO: name validations
  private throwIfInvalidName(_value: string) {}

  setFirstName(value: string) {
    this.throwIfInvalidName(value);
    this.data.firstName = value;
  }

  setLastName(value: string) {
    this.throwIfInvalidName(value);
    this.data.firstName = value;
  }

  setBirthDate(value: Date) {
    this.data.birth = value;
  }

  setProfileAvatar(value: string) {
    this.data.avatar = value;
  }
}
