import connection from "../connection";
import { Document, Schema } from "mongoose";

export interface PriceDetail {
  /**
   * Ride type
   */
  type: 1 | 2;
  /**
   * Defines if the ride type is available in the respective area
   */
  available: boolean;
  /**
   * Cost per kilometer
   */
  perKilometer: number;
  /**
   * Cost per minute
   */
  perMinute: number;

  kilometerMultipler: number;
  minuteMultipler: number;
  overBusinessTimeKmAdd: number;
  overBusinessTimeMinuteAdd: number;
}

export interface Price {
  area: string;
  currency: string;
  general: PriceDetail[];
  subAreas: { [subArea: string]: PriceDetail[] };
}

export interface PriceDocument extends Price, Document {}

const PriceDetailSchema: Schema = new Schema({
  type: { type: Number, enum: [1, 2], required: true },
  available: { type: Boolean, default: true },
  perKilometer: { type: Number, required: true },
  perMinute: { type: Number, required: true },
  kilometerMultipler: { type: Number, required: true },
  minuteMultipler: { type: Number, required: true },
  overBusinessTimeKmAdd: { type: Number, required: true },
  overBusinessTimeMinuteAdd: { type: Number, required: true },
});

export const PriceSchema: Schema = new Schema(
  {
    area: { type: String, unique: true },
    currency: { type: String, required: true },
    general: { type: PriceDetailSchema, required: true },
    subAreas: { type: Map, of: PriceDetailSchema, default: {} },
  },
  { collection: "prices" }
);

export const PriceModel = connection.model<PriceDocument>("Price", PriceSchema);
