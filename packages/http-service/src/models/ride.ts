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
      throw new Error('Route must be an object with "start", "path" and "end"');
    }

    if (
      !hasProp(route, "start") ||
      !hasProp(route, "path") ||
      !hasProp(route, "end")
    ) {
      throw new Error('Route object must have "start", "path" and "end" props');
    }

    if (typeof route.path !== "string") {
      throw new Error("Path must be an encoded polyline, like as string.");
    }

    this.checkPoint("start", route.start);
    this.checkPoint("end", route.end);

    if (hasProp(route, "checkpoints")) {
      for (let i = 0; i < (route.waypoints as RoutePoint[]).length; ++i)
        this.checkPoint(
          `checkpoint[${i}]`,
          (route.waypoints as RoutePoint[])[i]
        );
    }

    return route;
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
  coord: number[];
  primary: string;
  secondary: string;
};

type TRoute = {
  start: RoutePoint;
  waypoints?: RoutePoint[];
  end: RoutePoint;
  path: string;
};

export interface Ride {
  pid: string;
  voyager: User["_id"][];
  route: TRoute;
  driver?: User["_id"];
  pendencies?: Pendencie[];
}

export interface RideDocument extends Ride, Document {}

export const RideSchema: Schema = new Schema(
  {
    pid: { Type: String, default: shortid.generate },
    voyagers: {
      type: Array,
      of: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    route: { type: Route, required: true },
    options: Object,
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    pendencies: {
      type: Array,
      of: Schema.Types.ObjectId,
      ref: "Pendencies",
    },
  },
  { collection: "rides" }
);

export const RideModel = model<RideDocument>("Ride", RideSchema);
