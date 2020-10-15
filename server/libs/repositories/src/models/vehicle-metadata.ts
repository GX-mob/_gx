import { VehicleMetadataInterface, VehicleTypes } from "@shared/interfaces";
import { Document, Schema } from "mongoose";
import Connections from "../connections";

export interface VehicleMetadataDocument
  extends VehicleMetadataInterface,
    Document {}

export const VehicleMetadataSchema = new Schema(
  {
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    type: { type: String, enum: Object.values(VehicleTypes), required: true },
  },
  { collection: "vehicles_models" },
);

export const VehicleMetadataModel = Connections.Entities.model<
  VehicleMetadataDocument
>("VehicleModel", VehicleMetadataSchema);
