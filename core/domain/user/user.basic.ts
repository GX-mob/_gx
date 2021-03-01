import { IUser } from "./user.types";

export class UserBasic {
  private initialData: IUser;

  constructor(protected userData: IUser) {
    this.initialData = { ...userData };
  }

  public getID(): any {
    return this.userData._id;
  }

  public validate() {}

  public getUpdatedData(): Partial<IUser> {
    return {};
  }

  public getData(): IUser {
    return this.userData;
  }
}
