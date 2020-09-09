import { UserBasic } from "../common/user-basic";
import user from "../common/user-basic";

export type OfferSent = UserBasic;

export const offerSentSchema = user;

export default {
  id: 1,
  schema: offerSentSchema,
};
