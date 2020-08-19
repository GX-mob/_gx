export type OfferResponse = {
  /**
   * Offer id
   */
  id: "string";
  response: boolean;
};

export const schema = { id: "string", response: "boolean" };

export default {
  id: 0,
  schema,
};
