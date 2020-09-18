import { SchemaObject } from "schemapack";
import { userSchema, SendableUserData } from "./common";

export type OfferSent = SendableUserData;

export const offerSentSchema: SchemaObject<OfferSent> = userSchema;
