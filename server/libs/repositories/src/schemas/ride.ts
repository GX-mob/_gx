/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Document, Schema } from "mongoose";
import shortid from "shortid";
import { Operational } from "../connections";
import {
  IRide,
  ERideStatus,
  ERideTypes,
  ERidePayMethods,
} from "@core/domain/ride";
import { UserModel } from "./user";

export interface RideDocument extends IRide, Document {}

export const RoutePoint = new Schema({
  coord: { type: [Number], required: true },
  primary: { type: String, required: true },
  secondary: { type: String, required: true },
  district: String,
});

export const RouteSchema = new Schema({
  start: { type: RoutePoint, required: true },
  waypoints: { type: [RoutePoint], default: [] },
  end: { type: RoutePoint, required: true },
  path: { type: String, required: true },
  distance: { type: Number, required: true },
  duration: { type: Number, required: true },
});

export const RideSchema: Schema = new Schema(
  {
    pid: { type: String, default: shortid.generate, unique: true },
    voyager: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: UserModel,
    },
    type: { type: String, enum: Object.values(ERideTypes), required: true },
    payMethod: {
      type: String,
      enum: Object.values(ERidePayMethods),
      required: true,
    },
    route: { type: RouteSchema, required: true },
    driver: { type: Schema.Types.ObjectId, ref: UserModel },
    status: {
      type: String,
      enum: Object.values(ERideStatus),
      default: ERideStatus.Created,
    },
  },
  { collection: "rides" },
);

export const RideModel = Operational.model<RideDocument>("Ride", RideSchema);
