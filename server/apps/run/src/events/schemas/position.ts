import { latLngSchema, LatLng } from "./common";

/**
 * Position event schema
 */
export type Position = {
  /**
   * Latitude & longitude
   */
  latLng: LatLng;
  /**
   * Geolocation heading
   */
  heading: number;
  /**
   * User velocity in kmh
   */
  kmh: number;
  /**
   * Ignored watchers that already receive the event by the P2P connection
   */
  ignore: string[];
  pid: string;
};

export const positionSchema = {
  latLng: latLngSchema,
  heading: "uint8",
  kmh: "int16",
  ignore: ["string"],
  pid: "string",
};
