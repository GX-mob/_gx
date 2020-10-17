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
import mongoose, { Document, Schema } from "mongoose";
import shortid from "shortid";
import { util } from "@app/helpers";
import Connections from "../connections";
import {
  IRide,
  RideStatus,
  RideTypes,
  RidePayMethods,
  IRoute,
  IRoutePoint,
} from "@shared/interfaces";
import { UserModel } from "./user";

class Route extends mongoose.SchemaType {
  constructor(key: any, options: any) {
    super(key, options, "Route");
  }

  cast(route: IRoute) {
    if (!(route instanceof Object) || Object.keys(route).length < 3) {
      throw new Error(
        'Route must be an object with "start", "path", "end" and "distance" props',
      );
    }

    if (
      !util.hasProp(route, "start") ||
      !util.hasProp(route, "path") ||
      !util.hasProp(route, "distance") ||
      !util.hasProp(route, "end")
    ) {
      throw new Error(
        'Route object must have "start", "path", "end" and "distance" props',
      );
    }

    if (typeof route.distance !== "number") {
      throw new Error("Distance must be a number");
    }

    if (typeof route.path !== "string") {
      throw new Error("Path must be an encoded polyline, like as string.");
    }

    this.checkPoint("start", route.start);
    this.checkPoint("end", route.end);

    if (util.hasProp(route, "waypoints")) {
      for (let i = 0; i < (route.waypoints as IRoutePoint[]).length; ++i)
        this.checkPoint(
          `waypoints[${i}]`,
          (route.waypoints as IRoutePoint[])[i],
        );
    }

    return route;
  }

  checkPoint(name: string, point: IRoutePoint) {
    if (
      !util.hasProp(point, "coord") ||
      !util.hasProp(point, "primary") ||
      !util.hasProp(point, "secondary")
    ) {
      throw new Error(
        `"${name}" object must have "coord", "primary" and "secondary" props`,
      );
    }
  }
}

(mongoose.Schema.Types as any).Route = Route;

export interface RideDocument extends IRide, Document {}

export const RideSchema: Schema = new Schema(
  {
    pid: { type: String, default: shortid.generate, unique: true },
    voyager: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: UserModel,
    },
    type: { type: Number, enum: Object.values(RideTypes), required: true },
    payMethod: {
      type: Number,
      enum: Object.values(RidePayMethods),
      required: true,
    },
    route: { type: Route, required: true },
    driver: { type: Schema.Types.ObjectId, ref: UserModel },
    status: {
      type: String,
      enum: Object.values(RideStatus),
      default: RideStatus.CREATED,
    },
    pendencies: {
      type: Array,
      of: Schema.Types.ObjectId,
      ref: "Pendencie",
    },
  },
  { collection: "rides" },
);

export const RideModel = Connections.Operation.model<RideDocument>(
  "Ride",
  RideSchema,
);
