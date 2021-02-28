import { IUser, AvailableCountries } from "../../interfaces";
import { InvalidFederalIDException } from "./user.exceptions";

export class UserBasic {
  private initialData: IUser;

  constructor(protected userData: IUser){
    this.initialData = { ...userData };
  }

  public getID(): string {
    return this.userData._id;
  }

  public validate() {

  }

  public getUpdatedData(): Partial<IUser> {
    return {}
  }

}