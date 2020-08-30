import { Document, Schema } from "mongoose";
import Connections from "../connections";
import { RideModel } from "./ride";
import { User, UserModel } from "./user";

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
    ride: { type: Schema.Types.ObjectId, ref: RideModel, required: true },
    issuer: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    affected: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    resolved: { type: Boolean, default: false },
    amount: Number,
  },
  { collection: "pendencies" },
);

export const PendencieModel = Connections.Users.model<PendencieDocument>(
  "Pendencie",
  PendencieSchema,
);

export const PENDENCIE_MODEL_PROVIDER = "PENDENCIE_MODEL_PROVIDER";
