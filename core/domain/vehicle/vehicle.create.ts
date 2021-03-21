import { IUser, UserBase } from "../user";
import { IVehicle, TVehicleCreate } from "./vehicle.types";

export class VehicleCreate {
  private ownerId!: IUser["_id"];
  constructor(private vehicleData: TVehicleCreate) {}

  public setOwner(user: UserBase) {
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