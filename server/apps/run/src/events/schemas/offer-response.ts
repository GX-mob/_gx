export type OfferResponse = {
  /**
   * Ride public id
   */
  ridePID: string;
  response: boolean;
};

export const offerReponseSchema = { ridePID: "string", response: "boolean" };
