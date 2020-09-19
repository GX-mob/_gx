import { Document, Schema } from "mongoose";
import { PendencieInterface } from "@shared/interfaces";
import Connections from "../connections";
import { UserModel } from "./user";

export interface PendencieDocument extends PendencieInterface, Document {}

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
