import { Schema, type } from "@colyseus/schema";

export interface ILatLng {
  lat: number;
  lng: number;
}

export class LatLngSchema extends Schema implements ILatLng {
  @type("number")
  lat!: number;

  @type("number")
  lng!: number;
}
