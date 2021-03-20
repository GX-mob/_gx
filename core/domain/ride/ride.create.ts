import { TCreateRideDto } from "../../interfaces";
import { RideCosts } from "./ride.costs";
import { IRide } from "./ride.types";
import { User } from "../user"
import { RideRoute } from "./ride.route";
import { RideAreas } from "../ride-areas";

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

  public readonly rideRouteObject: RideRoute;
  public readonly rideCostsObject: RideCosts;

  constructor(private user: User, areas: RideAreas, private ride: TCreateRideDto){
    this.rideRouteObject = new RideRoute(ride);
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
      voyager: this.user.getID()
    }
  }
}