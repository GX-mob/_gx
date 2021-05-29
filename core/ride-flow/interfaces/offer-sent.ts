import { Schema, type } from "@colyseus/schema";
import { SchemaObject } from "../../types/schemapack";
import { ISendableUserData, UserSendableDataSchema } from "./common";

export interface IOfferSent {
  userData: ISendableUserData;
}

export class OfferSent extends Schema implements IOfferSent {
  @type(UserSendableDataSchema)
  userData!: UserSendableDataSchema;
}
