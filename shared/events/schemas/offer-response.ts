import { SchemaObject } from "schemapack";

export type OfferResponse = {
  /**
   * Ride public id
   */
  ridePID: string;
  response: boolean;
};

export const offerReponseSchema: SchemaObject<OfferResponse> = {
  ridePID: "string",
  response: "bool",
};
