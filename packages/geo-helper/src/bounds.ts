import { convertLatLng, LatLngBounds, LatLngLike } from "spherical-geometry-js";
import {
  calculate,
  workDistanceRoutePoints,
  percurredDistance,
} from "./distance";
import { decode } from "google-polyline";
import { Coord, Path } from "../types";

/**
 * Get bound of coordinates
 * @param {LatLng} latLng1
 * @param {LatLng} latLng2
 * @return {LatLngArray} [latitude, longitude]
 */
export function latLngBounds(
  latLng1: LatLngLike,
  latLng2: LatLngLike
): LatLngBounds {
  const latlng1 = convertLatLng(latLng1);
  const latlng2 = convertLatLng(latLng2);

  let distanceA = calculate(latLng1, [88.684058, -104.730958]);
  let distanceB = calculate(latLng2, [88.684058, -104.730958]);

  let boundsKeyA = Math.min(distanceA, distanceB).toString();
  let boundsKeyB = Math.max(distanceA, distanceB).toString();

  let latLngLiterals: { [k: string]: LatLngLike } = {
    [distanceA.toString()]: latlng1.toJSON(),
    [distanceB.toString()]: latlng2.toJSON(),
  };

  return new LatLngBounds(
    latLngLiterals[boundsKeyA],
    latLngLiterals[boundsKeyB]
  );
}

/**
 * Return LatLngBounds of path
 * @param {Path} path
 */
export function boundsOfPath(path: Path): LatLngBounds {
  if (typeof path === "string") path = decode(path);

  return latLngBounds(path[0], path[path.length - 1]);
}

/**
 * Return LatLngBounds running progress of path
 * @param {Path} path
 */
export function boundsOfRunningPath(path: Path, runnerPosition?: LatLngLike) {
  path = typeof path === "string" ? decode(path) : path;

  let mostDistanceRouteIdx = workDistanceRoutePoints("long", path);

  let boundingCoordsA: Coord;

  if (runnerPosition) {
    let { idx } = percurredDistance(path, runnerPosition);

    boundingCoordsA =
      mostDistanceRouteIdx > idx ? path[mostDistanceRouteIdx] : path[idx];
  } else boundingCoordsA = path[0];

  let boundingCoordsB = path[path.length - 1];

  return latLngBounds(boundingCoordsA, boundingCoordsB);
}
