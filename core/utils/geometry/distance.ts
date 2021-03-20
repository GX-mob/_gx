import {
  convertLatLng,
  LatLng,
  LatLngLike,
  computeDistanceBetween,
} from "spherical-geometry-js";
import { decimalAdjust } from "../common";
import { Path } from "./types";
//@ts-ignore
const { decode } = require("google-polyline");

/**
 * Calculates the distance between 2 points
 * @param {LatLngLike} latLng1 Coordinate 1
 * @param {LatLngLike} latLng2 Coordinate 2
 */
export function calculate(
  latLng1: LatLngLike,
  latLng2: LatLngLike,
  km: boolean = false,
) {
  const distance = computeDistanceBetween(latLng1, latLng2);

  return distance;
}

/**
 * Calculates the path length in meters
 * @param {Path} workPath
 * @param {number} start Start index point
 * @param {number} limit Limit index point
 * @return {number} Distance in meters
 */
export function path(
  path: string | Path,
  start: number = 0,
  limit?: number,
): number {
  const workPath = typeof path === "string" ? decode(path) : path;

  let distance = 0;
  let last;

  const maxIterate = limit || workPath.length;

  for (let count = start; count < maxIterate; ++count) {
    if (last) distance += calculate(last, workPath[count]);

    last = workPath[count];
  }

  return distance;
}

/**
 * Internal method to iterate over path points
 * @param {String} target
 * @param {DecodedPath} route
 * @param {LatLngLike} from
 */
export function workDistanceRoutePoints(
  target: "long" | "prox" | "next",
  route: Path,
  from?: LatLngLike,
  callback?: (point: LatLng) => void,
): number {
  let idx: number = 0;
  let lastDistance = target === "prox" ? 9e3 : 0;

  const _from = convertLatLng(from || route[0]);

  for (let count = 0; count < route.length; ++count) {
    let point = route[count];

    callback && callback(convertLatLng(point));

    let distance = calculate(_from, point);

    if (!lastDistance) {
      lastDistance = distance;
      continue;
    }

    if (target === "long" && distance > lastDistance) {
      idx = count;
      lastDistance = distance;
    } else if (target === "prox" && distance < lastDistance) {
      idx = count;
      lastDistance = distance;
    }
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
 * @return {PercurredDistance} PercurredDistance Object
 */
export function percurredDistance(
  Path: Path,
  point: LatLngLike,
): PercurredDistance {
  let internalRouteArr: Path = [];

  const now = convertLatLng(point);

  let idx = workDistanceRoutePoints(
    "prox",
    Path,
    now,
    ([latitude, longitude]) => {
      internalRouteArr.push([latitude, longitude]);
    },
  );

  let length = internalRouteArr.length;
  let nextIdx = idx + 1;

  if (nextIdx >= length) nextIdx = length - 1;

  let selectedToNext = calculate(
    internalRouteArr[idx],
    internalRouteArr[nextIdx],
  );
  let nowToNext = calculate(now, internalRouteArr[nextIdx]);

  let isBefore = nowToNext > selectedToNext;

  let routeToCalculate: Path = [];

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

/**
 * 2345 => 2.345
 * @param value
 */
export function meterToKM(value: number): number {
  return decimalAdjust(value / 1000, -3);
}
