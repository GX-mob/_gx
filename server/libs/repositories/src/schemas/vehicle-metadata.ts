import { IVehicleMetadata, EVehicleTypes } from "@core/domain/vehicle";
import { Document, Schema } from "mongoose";
import { Entities } from "../connections";

export interface VehicleMetadataDocument extends IVehicleMetadata, Document {}

export const VehicleMetadataSchema = new Schema(
  {
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    type: { type: String, enum: Object.values(EVehicleTypes), required: true },
  },
  { collection: "vehicles_metadata" },
);

export const VehicleMetadataModel = Entities.model<VehicleMetadataDocument>(
  "VehicleModel",
  VehicleMetadataSchema,
);
