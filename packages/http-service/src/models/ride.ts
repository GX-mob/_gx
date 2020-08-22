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
import mongoose, { Document, Schema, model } from "mongoose";
import shortid from "shortid";
import { User } from "./user";
import { Pendencie } from "./pendencie";

function hasProp(obj: any, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

class Route extends mongoose.SchemaType {
  constructor(key: any, options: any) {
    super(key, options, "Route");
  }

  cast(route: TRoute) {
    if (!(route instanceof Object) || Object.keys(route).length < 3) {
      throw new Error(
        'Route must be an object with "start", "path", "end" and "distance" props'
      );
    }

    if (
      !hasProp(route, "start") ||
      !hasProp(route, "path") ||
      !hasProp(route, "distance") ||
      !hasProp(route, "end")
    ) {
      throw new Error(
        'Route object must have "start", "path", "end" and "distance" props'
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

    if (hasProp(route, "waypoints")) {
      for (let i = 0; i < (route.waypoints as RoutePoint[]).length; ++i)
        this.checkPoint(
          `waypoints[${i}]`,
          (route.waypoints as RoutePoint[])[i]
        );
    }

    // return route;
  }

  checkPoint(name: string, point: RoutePoint) {
    if (
      !hasProp(point, "coord") ||
      !hasProp(point, "primary") ||
      !hasProp(point, "secondary")
    ) {
      throw new Error(
        `"${name}" object must have "coord", "primary" and "secondary" props`
      );
    }
  }
}

(mongoose.Schema.Types as any).Route = Route;

type RoutePoint = {
  coord: [number, number];
  primary: string;
  secondary: string;
  district: string;
};

type TRoute = {
  start: RoutePoint;
  waypoints?: RoutePoint[];
  end: RoutePoint;
  path: string;
  distance: number;
};

export interface Ride {
  pid: string;
  voyager: User["_id"];
  route: TRoute;
  /**
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  type: 1 | 2;
  /**
   * * 1 = Money
   * * 2 = Credit card
   */
  payMethod: 1 | 2;
  /**
   * Ride base cost
   */
  baseCost: number;
  /**
   * Ride final cost, calculated with the cost of pendencies
   */
  finalCost: number;
  status: "created" | "running" | "completed" | "canceled";
  driver?: User["_id"];
  pendencies?: Pendencie[];
}

export interface RideDocument extends Ride, Document {}

export const RideSchema: Schema = new Schema(
  {
    pid: { type: String, default: shortid.generate, unique: true },
    voyager: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    type: { type: Number, enum: [1, 2], required: true },
    route: { type: Route, required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["created", "running", "completed"],
      default: "created",
    },
    pendencies: {
      type: Array,
      of: Schema.Types.ObjectId,
      ref: "Pendencies",
    },
  },
  { collection: "rides" }
);

export const RideModel = model<RideDocument>("Ride", RideSchema);
