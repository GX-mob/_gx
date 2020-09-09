import EVENTS_MAP from "../events-map";

export type OfferResponse = {
  /**
   * Offer id
   */
  id: "string";
  response: boolean;
};

export const offerReponseSchema = { id: "string", response: "boolean" };

export default {
  id: EVENTS_MAP.OFFER_RESPONSE.ID,
  schema: offerReponseSchema,
};
