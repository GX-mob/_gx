import { TCreateRideDto } from "../../interfaces";
import { IRide, IRoutePoint } from "./ride.types";
import { hasProp } from "../../utils";
import {
  IncompleteRouteDataException,
  InvalidRoutePointException,
  ERouteExceptionCodes
} from "./ride.exceptions";

export class RideRoute {
  constructor(protected rideData: IRide | TCreateRideDto) {
    this.validateRequiredFields();
    this.valdiateRoutePoints();
  }

  private validateRequiredFields() {
    const { route } = this.rideData;

    if (
      !hasProp(route, "start") ||
      !hasProp(route, "path") ||
      !hasProp(route, "distance") ||
      !hasProp(route, "end")
    ) {
      throw new IncompleteRouteDataException();
    }
  }

  private valdiateRoutePoints() {
    const { route } = this.rideData;

    this.validateRoutePoint(route.start);
    this.validateRoutePoint(route.end);

    if (!route.waypoints) return;

    route.waypoints.forEach((point) => this.validateRoutePoint(point));
  }

  private validateRoutePoint(point: IRoutePoint) {
    if (
      !hasProp(point, "coord") ||
      !hasProp(point, "primary") ||
      !hasProp(point, "secondary") ||
      !hasProp(point, "district")
    ) {
      throw new InvalidRoutePointException();
    }

    const hasValidCoordinate = !Array.isArray(point.coord) || point.coord.every( coord => typeof coord !== "number" );

    if(hasValidCoordinate){
      throw new InvalidRoutePointException(ERouteExceptionCodes.InvalidField);
    }
  }
}
