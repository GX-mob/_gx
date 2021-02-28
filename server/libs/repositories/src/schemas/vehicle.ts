import { IVehicle } from "@core/interfaces";
import { Document, Schema, Types } from "mongoose";
import { Entities } from "../connections";
import { UserModel } from "./user";
import { VehicleMetadataModel } from "./vehicle-metadata";

export interface VehicleDocument extends IVehicle, Document {}

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

export const VehicleModel = Entities.model<VehicleDocument>(
  "Vehicle",
  VehicleSchema,
);
