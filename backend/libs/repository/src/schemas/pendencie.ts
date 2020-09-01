import { Document, Schema } from "mongoose";
import Connections from "../connections";
import { UserModel } from "./user";

export interface Pendencie {
  ride: string;
  issuer: any;
  amount: number;
  affected: any;
  resolved: boolean;
}

export interface PendencieDocument extends Pendencie, Document {}

export const PendencieSchema: Schema = new Schema(
  {
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    issuer: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    affected: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    resolved: { type: Boolean, default: false },
    amount: Number,
  },
  { collection: "pendencies" },
);

export const PendencieModel = Connections.Rides.model<PendencieDocument>(
  "Pendencie",
  PendencieSchema,
);
