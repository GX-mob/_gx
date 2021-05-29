import { SchemaObject } from "../../types/schemapack";
import { userSendableDataSchema, ISendableUserData } from "./common";

export interface IOfferSent extends ISendableUserData {}

export const offerSentSchema: SchemaObject<IOfferSent> = userSendableDataSchema;
