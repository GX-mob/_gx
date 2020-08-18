import { convertLatLng, LatLng, LatLngLike } from "spherical-geometry-js";
import { decode } from "google-polyline";
import { Path, DecodedPath } from "../types";
// internal
function calc(a: number, t: number, n: number, h: number): number {
  var r = 0.017453292519943295,
    s = (h - t) * r,
    M = (n - a) * r,
    c = Math.sin(M / 2),
    i = Math.cos(a * r),
    o = Math.sin(s / 2),
    q = c * c + i * i * (o * o);
  return 6368.1 * (2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)));
}

/**
 * Calculates the distance between 2 points
 * @param latLng1 Coordinate 1
 * @param latLng2 Coordinate 2
 * @param km if should return in kilometers
 */
export function calculate(
  latLng1: LatLngLike,
  latLng2: LatLngLike,
  km = false
) {
  const latlng = convertLatLng(latLng1);
  const latlng2 = convertLatLng(latLng2);
  const distance = calc(latlng[0], latlng[1], latlng2[0], latlng2[1]);

  return km ? distance : Math.round(distance * 1000);
}

/**
 * Calculates the distance of path
 * @param {Path} path
 * @param start Start point
 * @param limit Limite point
 * @return {number} Distance in meters
 */
export function path(path: Path, start = 0, limit?: number): number {
  if (typeof path === "string") {
    path = decode(path);
  }

  let distance = 0;
  let last;

  const maxIterate = limit || path.length;

  for (let count = start; count < maxIterate; ++count) {
    if (last) distance += calculate(last, path[count]);

    // if (limit && count === maxIterate) break;

    last = path[count];
  }

  return distance;
}

/**
 * Internal method to iterate over path points
 * @param latLng1 Coordinate 1
 * @param latLng2 Coordinate 2
 * @param km if shoudl return in kilometers
 */
export function workDistanceRoutePoints(
  target: "long" | "prox" | "next",
  route: DecodedPath,
  from?: LatLngLike,
  callback?: (point: LatLng) => void
): number {
  let idx: number = 0;
  let ldistance = target === "prox" ? 9e3 : 0;

  const _from = convertLatLng(from || route[0]);

  for (let count = 0; count < route.length; ++count) {
    let point = route[count];

    callback && callback(convertLatLng(point));

    let distance = calculate(_from, point);

    if (ldistance) {
      if (target === "long" && distance > ldistance) {
        idx = count;
        ldistance = distance;
      } else if (target === "prox" && distance < ldistance) {
        idx = count;
        ldistance = distance;
      }
    } else ldistance = distance;
  }

  return idx;
}

type PercurredDistance = {
  /**
   * Total distance
   */
  total: number;
  /**
   * Left distance
   */
  left: number;
  /**
   * Percurred distance
   */
  percurred: number;
  /**
   * Most near index path
   */
  idx: number;
  /**
   * Is before the most near index
   */
  isBefore: boolean;
  /**
   * Next index
   */
  nextIdx: number;
};

/**
 * Get percurred distance of a path relative to a point
 * @param {DecodedPath} Path
 * @param {LatLngLike} point
 * @param km if shoudl return in kilometers
 * @return {PercurredDistance} PercurredDistance Object
 */
export function percurredDistance(
  Path: DecodedPath,
  point: LatLngLike
): PercurredDistance {
  let internalRouteArr: DecodedPath = [];

  const now = convertLatLng(point);

  let idx = workDistanceRoutePoints("prox", Path, now, (point) => {
    internalRouteArr.push([point[0], point[1]]);
  });

  let length = internalRouteArr.length;
  let nextIdx = idx + 1;

  if (nextIdx >= length) nextIdx = length - 1;

  let selectedToNext = calculate(
    internalRouteArr[idx],
    internalRouteArr[nextIdx]
  );
  let nowToNext = calculate(now, internalRouteArr[nextIdx]);

  let isBefore = nowToNext > selectedToNext;

  let routeToCalculate: DecodedPath = [];

  let initCount = idx;

  if (isBefore) --initCount;

  for (let n = 0; n < initCount; ++n)
    routeToCalculate.push(internalRouteArr[n]);

  routeToCalculate.push([now[0], now[1]]);

  let total = path(internalRouteArr);
  let percurred = path(routeToCalculate);
  let left = total - percurred;

  return {
    total,
    left,
    percurred,
    idx,
    isBefore,
    nextIdx: isBefore ? idx : idx + 1,
  };
}
