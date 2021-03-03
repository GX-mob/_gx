import { UserBasic } from "./user.basic";

export class UserProfile extends UserBasic {
  // @TODO: name validations
  private throwIfInvalidName(_value: string) {}

  setFirstName(value: string) {
    this.throwIfInvalidName(value);
    this.userData.firstName = value;
  }

  setLastName(value: string) {
    this.throwIfInvalidName(value);
    this.userData.firstName = value;
  }

  setBirthDate(value: Date) {
    this.userData.birth = value;
  }

  setProfileAvatar(value: string) {
    this.userData.avatar = value;
  }
}
