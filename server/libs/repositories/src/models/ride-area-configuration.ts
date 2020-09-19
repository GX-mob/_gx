import { Document, Schema } from "mongoose";
import Connections from "../connections";
import { RideAreaConfigurationInterface, RideTypes } from "@shared/interfaces";

export interface RideAreaConfigurationDocument
  extends RideAreaConfigurationInterface,
    Document {}

const RideTypeConfigurationSchema = new Schema({
  type: { type: Number, enum: Object.values(RideTypes), required: true },
  available: { type: Boolean, default: true },
  perKilometer: { type: Number, required: true },
  perMinute: { type: Number, required: true },
  kilometerMultipler: { type: Number, required: true },
  minuteMultipler: { type: Number, required: true },
  overBusinessTimeKmAdd: { type: Number, required: true },
  overBusinessTimeMinuteAdd: { type: Number, required: true },
});

export const RideAreaConfigurationSchema = new Schema(
  {
    area: { type: String, unique: true, required: true },
    currency: { type: String, required: true },
    timezone: { type: String, required: true },
    general: {
      type: [RideTypeConfigurationSchema],
      required: true,
      validate: {
        validator(v: any[]) {
          return Boolean(v.length);
        },
        message(props) {
          return `${props.value} must have last one value.`;
        },
      },
    },
    subAreas: {
      type: Map,
      of: { type: [RideTypeConfigurationSchema] },
      default: {},
    },
  },
  { collection: "ride_areas_configurations" },
);

export const RideAreaConfigurationModel = Connections.Configuration.model<
  RideAreaConfigurationDocument
>("RideAreaConfiruation", RideAreaConfigurationSchema);
