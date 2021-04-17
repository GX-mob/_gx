import { IAccount, AccountBase } from "../account";
import { IVehicle, TVehicleCreate } from "./vehicle.types";

export class VehicleCreate {
  private ownerId!: IAccount["_id"];
  constructor(private vehicleData: TVehicleCreate) {}

  public setOwner(user: AccountBase) {
    this.ownerId = user.getID();
  }

  public toJSON(): IVehicle {
    return {
      ...this.vehicleData,
      owner: this.ownerId,
      _id: undefined,
      inUse: false,
      verificationId: "",
      permissions: []
    }
  }
}