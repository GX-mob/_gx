import { SchemaObject } from "../../types/schemapack";
import { ILatLng } from "./common";
import { positionSchema } from "./position";

export interface IFinishRide {
  ridePID: string;
  latLng: ILatLng;
}

export const finishRideSchema: SchemaObject<IFinishRide> = {
  ridePID: "string",
  latLng: positionSchema.latLng,
};
