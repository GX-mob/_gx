import { IUser } from "../../interfaces/models/user.interface";
import { UserBasic  } from "./user.basic";

export class UserProfile extends UserBasic {
  // @TODO: name validations
  private isValidName(_value: string) {}

  setFirstName(value: string) {
    this.isValidName(value);
    this.userData.firstName = value;
  }

  setLastName(value: string) {
    this.isValidName(value);
    this.userData.firstName = value;
  }

  setBirthDate(value: Date) {
    this.userData.birth = value
  }

  setProfileAvatar(value: string) {
    this.userData.avatar = value;
  }
}