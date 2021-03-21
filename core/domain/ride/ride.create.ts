import { TCreateRideDto } from "../../interfaces";
import { RideAreas } from "../ride-areas";
import { User } from "../user";
import { RideCosts } from "./ride.costs";
import { RideRoute } from "./ride.route";
import { IRide } from "./ride.types";

export type TRideCreate = Pick<
  IRide,
  | "country"
  | "area"
  | "subArea"
  | "type"
  | "route"
  | "costs"
  | "payMethod"
  | "voyager"
>;

export class RideCreate {
  public readonly rideRouteObject: RideRoute;
  public readonly rideCostsObject: RideCosts;

  constructor(
    private user: User,
    areas: RideAreas,
    private ride: TCreateRideDto,
  ) {
    this.rideRouteObject = new RideRoute(ride);
    this.rideRouteObject.validate();
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
      voyager: this.user.getID(),
    };
  }
}
