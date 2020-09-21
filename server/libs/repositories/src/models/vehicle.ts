import { VehicleInterface } from "@shared/interfaces";
import { Document, Schema, Types } from "mongoose";
import Connections from "../connections";
import { UserModel } from "./user";
import { VehicleMetadataModel } from "./vehicle-metadata";

export interface VehicleDocument extends VehicleInterface, Document {}

export const VehicleSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: UserModel, required: true },
    plate: { type: String, required: true },
    year: { type: Number, required: true },
    inUse: Boolean,
    metadata: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: VehicleMetadataModel,
    },
    permissions: {
      type: Array,
      of: Schema.Types.ObjectId,
      ref: UserModel,
    },
  },
  { collection: "vehicles" },
);

export const VehicleModel = Connections.Users.model<VehicleDocument>(
  "Vehicle",
  VehicleSchema,
);
