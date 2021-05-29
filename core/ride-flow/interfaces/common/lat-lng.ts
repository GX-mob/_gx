import { SchemaObject } from "../../../types/schemapack";

export interface ILatLng {
  lat: number;
  lng: number;
}

export const latLngSchema: SchemaObject<ILatLng> = {
  lat: "float64",
  lng: "float64",
};
