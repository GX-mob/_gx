import { IVehicleMetadata, VehicleTypes } from "@shared/interfaces";
import { Document, Schema } from "mongoose";
import { Entities } from "../connections";

export interface VehicleMetadataDocument extends IVehicleMetadata, Document {}

export const VehicleMetadataSchema = new Schema(
  {
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    type: { type: String, enum: Object.values(VehicleTypes), required: true },
  },
  { collection: "vehicles_models" },
);

export const VehicleMetadataModel = Entities.model<VehicleMetadataDocument>(
  "VehicleModel",
  VehicleMetadataSchema,
);
