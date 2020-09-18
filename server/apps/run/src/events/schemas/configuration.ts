import { SchemaObject } from "schemapack";
import { RidePayMethods, RideTypes } from "@app/repositories";

export type Configuration = {
  /**
   * Pay method accepts list
   *
   * A list of accepted pay method that drivers choose
   * as their to receive only offers that match
   */
  payMethods: RidePayMethods[];
  /**
   * Ride types list
   *
   * A list of rides types that drivers choose as their
   * to receive only offers that match
   */
  types: RideTypes[];
  /**
   * End drop districts
   *
   * A list of districts that drivers choose as their
   * destination for receive only offers that match
   */
  drops: ["any"] | string[];
};

export const configurationSchema: SchemaObject<Configuration> = {
  payMethods: ["uint8"],
  types: ["uint8"],
  drops: ["string"],
};
