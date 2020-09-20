import { VehicleModelInterface, VehicleTypes } from "@shared/interfaces";
import { Document, Schema } from "mongoose";
import Connections from "../connections";

export interface VehicleModelDocument extends VehicleModelInterface, Document {}

export const VehicleModelSchema = new Schema(
  {
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    type: { type: String, enum: Object.values(VehicleTypes), required: true },
  },
  { collection: "vehicles_models" },
);

export const VehicleModelModel = Connections.Users.model<VehicleModelDocument>(
  "VehicleModel",
  VehicleModelSchema,
);
