import { UserBase } from "./user.base";

export class UserProfile extends UserBase {
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
