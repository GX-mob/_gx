import { ICreateRideDto } from "../../interfaces";
import { RideCosts } from "./ride.costs";
import { IRide, IRideAreaConfiguration } from "./ride.types";
import { IUser } from "../user"

export type TRideCreate = Pick<IRide,
  | "country"
  | "area"
  | "subArea"
  | "type" 
  | "route"
  | "costs"
  | "payMethod"
  | "voyager"
>

export class RideCreate {

  public readonly rideCostsObject: RideCosts;

  constructor(private user: IUser, areas: IRideAreaConfiguration[], private ride: ICreateRideDto){
    this.rideCostsObject = new RideCosts(areas, ride);
  }

  public toJSON(): TRideCreate {
    return {
      country: this.ride.country,
      area: this.ride.area,
      subArea: this.ride.subArea,
      type: this.ride.type,
      route: this.ride.route,
      costs: this.rideCostsObject.toJSON(),
      payMethod: this.ride.payMethod,
      voyager: this.user._id
    }
  }
}