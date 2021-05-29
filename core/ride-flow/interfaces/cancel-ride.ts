import { Schema, type } from "@colyseus/schema";

export interface ICancelRide {
  ridePID: string;
}

export class CancelRideSchema extends Schema implements ICancelRide {
  @type("string")
  ridePID!: string;
}
