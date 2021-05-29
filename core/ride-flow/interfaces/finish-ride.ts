import { Schema, type } from "@colyseus/schema";
import { ILatLng, LatLngSchema } from "./common";

export interface IFinishRide {
  ridePID: string;
  latLng: ILatLng;
}

export class FinishRideSchema extends Schema implements IFinishRide {
  @type("string")
  ridePID!: string;

  @type(LatLngSchema)
  latLng!: LatLngSchema;
}
