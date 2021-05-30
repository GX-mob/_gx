import { Schema, type } from "@colyseus/schema";
import { ILatLng, LatLngSchema } from "./common/lat-lng";

export interface IStartRide {
  ridePID: string;
  latLng: ILatLng;
}

export class StartRideSchema extends Schema implements IStartRide {
  @type("string")
  ridePID!: string;

  @type(LatLngSchema)
  latLng!: LatLngSchema;
}
