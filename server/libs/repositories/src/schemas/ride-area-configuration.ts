import { Document, Schema } from "mongoose";
import { Configuration } from "../connections";
import { ERideTypes } from "@core/domain/ride";
import { IRideAreaConfiguration } from "@core/domain/ride-areas";
import { EDatabaseCollectionsNames } from "../constants";

export interface RideAreaConfigurationDocument
  extends IRideAreaConfiguration,
    Document {}

const RideTypeConfigurationSchema = new Schema({
  type: { type: String, enum: Object.values(ERideTypes), required: true },
  available: { type: Boolean, default: true },
  perKilometer: { type: Number, required: true },
  perMinute: { type: Number, required: true },
  kilometerMultipler: { type: Number, required: true },
  minuteMultipler: { type: Number, required: true },
  overBusinessTimeKmAdd: { type: Number, required: true },
  overBusinessTimeMinuteAdd: { type: Number, required: true },
});

const OfferConfigSchema = new Schema({
  initialRadiusSize: { type: Number, required: true },
  additionalRadiusSizeByEachIteration: { type: Number, required: true },
  maxRadiusSize: { type: Number, required: true },
});

export const RideAreaConfigurationSchema = new Schema(
  {},
  { collection: EDatabaseCollectionsNames.AreasConfigurations },
);

RideAreaConfigurationSchema.add({
  area: { type: String, unique: true, required: true },
  currency: { type: String, required: true },
  timezone: { type: String, required: true },
  ridesTypes: {
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
    of: { type: RideAreaConfigurationSchema },
    default: {},
  },
  offerConfig: { type: OfferConfigSchema, required: true },
});

export const RideAreaConfigurationModel = Configuration.model<
  RideAreaConfigurationDocument
>("RideAreaConfiruation", RideAreaConfigurationSchema);
