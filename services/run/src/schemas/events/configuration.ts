import { OfferRequest } from "./offer";

export type Configuration = {
  /**
   * Pay method accepts list
   *
   * A list of accepted pay method that drivers choose
   * as their to receive only offers that match
   */
  payMethods: OfferRequest["payMethod"][];
  /**
   * Ride types list
   *
   * A list of rides types that drivers choose as their
   * to receive only offers that match
   */
  types: OfferRequest["type"][];
  /**
   * End drop districts
   *
   * A list of districts that drivers choose as their
   * destination to receive only offers that match
   */
  drops: string[];
};

export const schema = {
  payMethods: ["uint8"],
  types: ["uint8"],
};

export default {
  id: 0,
  schema,
};
