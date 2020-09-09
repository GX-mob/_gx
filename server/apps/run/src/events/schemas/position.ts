import latLng, { LatLng } from "../common/lat-lng";

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
  ignored: string[];
  id: string;
};

export const positionSchema = {
  latLng,
  heading: "uint8",
  kmh: "int16",
  ignore: ["string"],
  id: "string",
};
