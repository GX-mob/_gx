import { User } from "../user";
import { RideBase } from "./ride.base";
import { RideCosts } from "./ride.costs";
import { RideRoute } from "./ride.route";
import { ERideStatus, IRide, IRoute } from "./ride.types";

export class Ride extends RideBase {
  public readonly rideRouteObject: RideRoute;
  constructor(protected data: IRide) {
    super(data);
    this.rideRouteObject = new RideRoute(data);
  }

  setStatus(status: ERideStatus) {
    this.data.status = status;
  }

  setDriver(driver: User) {
    this.data.driver = driver.getID();
  }

  updateRoute(route: IRoute) {
    this.rideRouteObject.setRoute(route);
  }

  updateCosts(costs: RideCosts) {
    this.data.costs = costs.toJSON();
  }

  validate() {
    this.rideRouteObject.validate();
  }
}
