import { RidePayMethods, RideTypes } from "@app/database";

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
  drops: string[];
};

export const configurationSchema = {
  payMethods: ["uint8"],
  types: ["uint8"],
};
