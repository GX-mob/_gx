import { TCreateRideDto } from "../../interfaces";
import { hasProp } from "../../utils";
import {
  ERouteExceptionsCodes,
  IncompleteRouteDataException,
  InvalidRoutePointException,
} from "./ride.exceptions";
import { IRide, IRoute, IRoutePoint } from "./ride.types";

export class RideRoute {
  constructor(protected rideData: IRide | TCreateRideDto) {}

  public validate() {
    this.validateRoute();
    this.valdiateRoutePoints();
  }

  public addWaypoint(point: IRoutePoint, index?: number) {
    this.validateRoutePoint(point);

    if (!index) {
      this.rideData.route.waypoints.push(point);
    } else {
      this.rideData.route.waypoints.splice(index, 0, point);
    }
  }

  /**
   * Turn the current endpoint in the last waypoint and set the new endpoint
   */
  addEndpoint(point: IRoutePoint) {
    const currentEndPoint: IRoutePoint = { ...this.rideData.route.end };
    this.addWaypoint(currentEndPoint);
    this.setEndpoint(point);
  }

  setEndpoint(point: IRoutePoint) {
    this.validateRoutePoint(point);
    this.rideData.route.end = point;
  }

  setRoute(route: IRoute) {
    this.validateRoute(route);
    this.rideData.route = route;
  }

  private validateRoute(route: IRoute = this.rideData.route) {
    if (
      !hasProp(route, "start") ||
      !hasProp(route, "path") ||
      !hasProp(route, "distance") ||
      !hasProp(route, "end")
    ) {
      throw new IncompleteRouteDataException(ERouteExceptionsCodes.EmptyField);
    }
  }

  private valdiateRoutePoints() {
    const { route } = this.rideData;

    this.validateRoutePoint(route.start);
    this.validateRoutePoint(route.end);

    for (const point of route.waypoints) {
      this.validateRoutePoint(point);
    }
  }

  private validateRoutePoint(point: IRoutePoint) {
    if (!point.coord || !point.primary || !point.secondary || !point.district) {
      throw new InvalidRoutePointException(ERouteExceptionsCodes.EmptyField);
    }

    const hasInvalidCoordinate =
      !Array.isArray(point.coord) ||
      point.coord.some((coord) => typeof coord !== "number");

    if (hasInvalidCoordinate) {
      throw new InvalidRoutePointException(ERouteExceptionsCodes.InvalidField);
    }
  }
}
