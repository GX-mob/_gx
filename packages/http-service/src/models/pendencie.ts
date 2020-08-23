import { Document, Schema, model } from "mongoose";
import shortid from "shortid";
import { User } from "./user";

export interface Pendencie {
  ride: string;
  issuer: User["_id"];
  amount: number;
  affected: User["_id"];
  resolved: boolean;
}

export interface PendencieDocument extends Pendencie, Document {}

export const PendencieSchema: Schema = new Schema(
  {
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    issuer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    affected: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolved: { type: Boolean, default: false },
    amount: Number,
  },
  { collection: "pendencies" }
);

export const PendencieModel = model<PendencieDocument>(
  "Pendencie",
  PendencieSchema
);
