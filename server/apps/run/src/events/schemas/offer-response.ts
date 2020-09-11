export type OfferResponse = {
  /**
   * Ride public id
   */
  ridePID: string;
  response: boolean;
};

export const offerReponseSchema = { id: "string", response: "boolean" };
