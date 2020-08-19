export type OfferResponse = {
  /**
   * Offer id
   */
  id: "string";
  response: boolean;
};

export const schema = { offerID: "string", response: "boolean" };

export default {
  id: 0,
  schema,
};
