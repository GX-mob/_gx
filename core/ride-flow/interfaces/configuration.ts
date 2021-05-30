import { ArraySchema, Schema, type } from "@colyseus/schema";
import { ERidePayMethods, ERideTypes } from "../../domain/ride";

export interface IConfiguration {
  /**
   * Pay method accepts list
   *
   * A list of accepted pay method that drivers choose
   * as their to receive only offers that match
   */
  payMethods: ERidePayMethods[];
  /**
   * Ride types list
   *
   * A list of rides types that drivers choose as their
   * to receive only offers that match
   */
  types: ERideTypes[];
  /**
   * End drop districts
   *
   * A list of districts that drivers choose as their
   * destination for receive only offers that match
   */
  drops: string[];
}

export class ConfigurationSchema extends Schema implements IConfiguration {
  @type(["string"])
  payMethods = new ArraySchema<ERidePayMethods>();

  @type(["string"])
  types = new ArraySchema<ERideTypes>();

  @type(["string"])
  drops = new ArraySchema<string>();
}
