import { IRide } from "./ride.types";

export class RideBasic {
  private initialData: IRide;

  constructor(protected data: IRide) {
    this.initialData = { ...data };
  }

  public getID(): any {
    return this.data._id;
  }

  public validate() {}

  public getUpdatedData(): Partial<IRide> {
    return {};
  }

  public getData(): IRide {
    return this.data;
  }
}
