import { Schema, type } from "@colyseus/schema";
import { SchemaObject } from "../../../types/schemapack";
import { ILatLng, LatLngSchema } from "./lat-lng";

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

export class LocationSchema extends Schema implements ILocation {
  @type("string")
  main!: string;

  @type("string")
  secondary!: string;

  @type("string")
  district!: string;

  @type("string")
  latLng!: LatLngSchema;
}
