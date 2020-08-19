import { calculate } from "./distance";

export type GoogleLatLngObject = { lat(): number; lng(): number };
export type LiteralLatLng = { lat: number; lng: number };
export type LatLngArray = [number, number];

export type LatLng = GoogleLatLngObject | LiteralLatLng | LatLngArray;

/**
 * Parse latitude longitude object into array
 * @param object
 * @return {LatLngArray} [latitude, longitude]
 */
export function toArray(object: LatLng): LatLngArray {
  if (Array.isArray(object)) return object;

  if (typeof object.lat === "function" && typeof object.lng === "function")
    return [object.lat(), object.lng()];

  return [object.lat, object.lng] as LatLngArray;
}

/**
 * Parse latitude longitude object into literal object
 * @param object
 * @return {LatLngArray} [latitude, longitude]
 */
export function toLiteral(object: LatLng): LiteralLatLng {
  const obj = toArray(object);

  return {
    lat: obj[0],
    lng: obj[1],
  };
}

/**
 * Parse latitude longitude object into google api compatible object
 * @param object
 * @return {LatLngArray} [latitude, longitude]
 */
export function toObject(object: LatLng): GoogleLatLngObject {
  const obj = toArray(object);

  return {
    lat: () => obj[0],
    lng: () => obj[1],
  };
}

/**
 * Get bound of coordinates
 * @param {LatLng} latLng1
 * @param {LatLng} latLng2
 * @return {LatLngArray} [latitude, longitude]
 */
export function latLngBounds(latLng1: LatLng, latLng2: LatLng) {
  latLng1 = toArray(latLng1);
  latLng2 = toArray(latLng2);

  let distanceA = calculate(latLng1, [88.684058, -104.730958]);
  let distanceB = calculate(latLng2, [88.684058, -104.730958]);

  let boundsKeyA = Math.min(distanceA, distanceB).toString();
  let boundsKeyB = Math.max(distanceA, distanceB).toString();

  let latLngLiterals = {};

  latLngLiterals[distanceA.toString()] = {
    lat: latLng1[0],
    lng: latLng1[1],
  };

  latLngLiterals[distanceB.toString()] = {
    lat: latLng2[0],
    lng: latLng2[1],
  };

  return new LatLngBounds(
    latLngLiterals[boundsKeyA],
    latLngLiterals[boundsKeyB]
  );
}
