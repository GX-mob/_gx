import { convertLatLng, LatLngBounds, LatLngLike } from "spherical-geometry-js";
import {
  calculate,
  workDistanceRoutePoints,
  percurredDistance,
} from "./distance";
const { decode } = require("google-polyline");

type Coord = [number, number];
type Path = Coord[];

/**
 * Get bound of coordinates
 * @param {LatLng} latLng1
 * @param {LatLng} latLng2
 * @return {LatLngBounds} The bounds
 */
export function latLngBounds(
  latLng1: LatLngLike,
  latLng2: LatLngLike,
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
    latLngLiterals[boundsKeyB],
  );
}

/**
 * Return LatLngBounds of path
 * @param {Path} path
 * @return {LatLngBounds} The bounds
 */
export function boundsOfPath(path: Path): LatLngBounds {
  const workPath = typeof path === "string" ? decode(path) : path;

  return latLngBounds(workPath[0], workPath[path.length - 1]);
}

/**
 * Return LatLngBounds running progress of path
 * @param {Path} workPath
 * @param {LatLngLike} runnerPosition
 * @return {LatLngBounds} The bounds
 */
export function boundsOfRunningPath(
  path: string | Path,
  runnerPosition?: LatLngLike,
): LatLngBounds {
  const workPath = typeof path === "string" ? decode(path) : path;

  let mostDistanceRouteIdx = workDistanceRoutePoints("long", workPath);

  let boundingCoordsA: Coord;

  if (runnerPosition) {
    let { idx } = percurredDistance(workPath, runnerPosition);

    boundingCoordsA =
      mostDistanceRouteIdx > idx
        ? workPath[mostDistanceRouteIdx]
        : workPath[idx];
  } else boundingCoordsA = workPath[0];

  let boundingCoordsB = workPath[workPath.length - 1];

  return latLngBounds(boundingCoordsA, boundingCoordsB);
}
