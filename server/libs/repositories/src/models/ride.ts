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
import { Pendencie } from "./pendencie";
import { UserModel } from "./user";

class Route extends mongoose.SchemaType {
  constructor(key: any, options: any) {
    super(key, options, "Route");
  }

  cast(route: TRoute) {
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
      for (let i = 0; i < (route.waypoints as TRoutePoint[]).length; ++i)
        this.checkPoint(
          `waypoints[${i}]`,
          (route.waypoints as TRoutePoint[])[i],
        );
    }

    return route;
  }

  checkPoint(name: string, point: TRoutePoint) {
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

export type TRoutePoint = {
  /**
   * Latitude and longitude
   */
  coord: [number, number];
  /**
   * Primary title
   */
  primary: string;
  /**
   * Secondary title
   */
  secondary: string;
  /**
   * Slug name of district
   */
  district: string;
};

export type TRoute = {
  start: TRoutePoint;
  waypoints?: TRoutePoint[];
  end: TRoutePoint;
  path: string;
  distance: number;
  duration: number;
};

export enum RideTypes {
  Normal = 1,
  VIG = 2,
}

export enum RidePayMethods {
  Money = 1,
  CreditCard = 2,
}

export enum RideStatus {
  CREATED,
  RUNNING,
  COMPLETED,
  CANCELED,
}

export interface Ride {
  _id: any;
  pid: string;
  voyager: any;
  route: TRoute;
  /**
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  type: RideTypes;
  /**
   * * 1 = Money
   * * 2 = Credit card
   */
  payMethod: RidePayMethods;
  /**
   * Ride costs
   */
  costs: {
    /**
     * Ride cost, distance + duration
     */
    base: number;
    distance: {
      total: number;
      aditionalForLongRide: number;
      aditionalForOutBusinessTime: number;
    };
    duration: {
      total: number;
      aditionalForLongRide: number;
      aditionalForOutBusinessTime: number;
    };
    /**
     * Total cost, ride costs + pendencies costs
     */
    total: number;
  };
  country: string;
  area: string;
  subArea: string;
  status: RideStatus;
  driver?: any;
  pendencies?: Pendencie[];
}

export interface RideDocument extends Ride, Document {}

export const RideSchema: Schema = new Schema(
  {
    pid: { type: String, default: shortid.generate, unique: true },
    voyager: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: UserModel,
    },
    type: { type: Number, enum: [1, 2], required: true },
    payMethod: { type: Number, enum: [1, 2], required: true },
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

export const RideModel = Connections.Rides.model<RideDocument>(
  "Ride",
  RideSchema,
);
