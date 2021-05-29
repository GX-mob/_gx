import { Schema, type } from "@colyseus/schema";
import { LatLngSchema, ILatLng } from "./common";

/**
 * Position event schema
 */
export interface IPositionData {
  /**
   * Latitude & longitude
   */
  latLng: ILatLng;
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
}

export class PositionSchema extends Schema implements IPositionData {
  @type(LatLngSchema)
  latLng!: LatLngSchema;

  @type("number")
  heading!: number;

  @type("number")
  kmh!: number;

  @type(["string"])
  ignore!: string[];

  @type("string")
  pid!: string;
}
