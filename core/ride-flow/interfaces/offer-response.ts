import { Schema, type } from "@colyseus/schema";

export interface IOfferResponse {
  /**
   * Ride public id
   */
  ridePID: string;
  accepted: boolean;
}

export class OfferResponseSchema extends Schema implements IOfferResponse {
  @type("string")
  ridePID!: string;

  @type("boolean")
  accepted!: boolean;
}
