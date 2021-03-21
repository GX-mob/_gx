import { DomainBase } from "../base-classes/domain-base";
import { IVehicle } from "./vehicle.types";

export class VehicleBase extends DomainBase<IVehicle> {
  constructor(protected data: IVehicle) {
    super(data);
  }

  public validate() {}
}
