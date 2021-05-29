import { SchemaObject } from "types/schemapack";
import { latLngSchema, ILatLng } from "./lat-lng";

export interface ILocation {
  /**
   * Main title, contains the street name and may the number
   */
  main: string;
  /**
   * Secondary title, contains the district, city and state
   */
  secondary: string;
  /**
   * slug of district
   */
  district: string;
  /**
   * Latitude and longitude
   */
  latLng: ILatLng;
}

export const locationSchema: SchemaObject<ILocation> = {
  main: "string",
  secondary: "string",
  district: "string",
  latLng: latLngSchema,
};
