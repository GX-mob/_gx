import latLng, { latLngType } from "../common/lat-lng";

export type PositionEvent = {
  /**
   * Latitude & longitude
   */
  latLng: latLngType;
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
};

/**
 * Position event schema
 */
export default {
  id: 1,
  schema: {
    latLng,
    heading: "uint",
    kmh: "int16",
    ignore: ["string"],
  },
};
