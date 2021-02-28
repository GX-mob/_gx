import { SchemaObject } from "../../types/schemapack";
import { userSchema, SendableUserData } from "./common";

export type OfferSent = SendableUserData;

export const offerSentSchema: SchemaObject<OfferSent> = userSchema;
