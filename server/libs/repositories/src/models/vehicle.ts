import { VehicleInterface } from "@shared/interfaces";
import { Document, Schema, Types } from "mongoose";
import Connections from "../connections";
import { UserModel } from "./user";
import { VehicleModelModel } from "./vehicle-model";

export interface VehicleDocument extends VehicleInterface, Document {}

export const VehicleSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: UserModel, required: true },
    plate: { type: String, required: true },
    year: { type: Number, required: true },
    inUse: Boolean,
    vmodel: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: VehicleModelModel,
    },
    permissions: {
      type: Array,
      of: { user: String, expiration: Number },
    },
  },
  { collection: "vehicles" },
);

export const VehicleModel = Connections.Users.model<VehicleDocument>(
  "Vehicle",
  VehicleSchema,
);
