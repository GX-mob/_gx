import { SchemaObject } from "../../types/schemapack";
import { latLngSchema, ILatLng } from "./common";

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
};

export const positionSchema: SchemaObject<IPositionData> = {
  latLng: latLngSchema,
  heading: "uint8",
  kmh: "int16",
  ignore: ["string"],
  pid: "string",
};
