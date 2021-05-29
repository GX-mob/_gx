import { SchemaObject } from "../../types/schemapack";

export interface IOfferResponse {
  /**
   * Ride public id
   */
  ridePID: string;
  accepted: boolean;
};

export const offerReponseSchema: SchemaObject<IOfferResponse> = {
  ridePID: "string",
  accepted: "bool",
};
