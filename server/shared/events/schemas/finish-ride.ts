import { SchemaObject } from "../../types/schemapack";
import { Position, positionSchema } from "./position";

export type FinishRide = { ridePID: string; latLng: Position["latLng"] };
export const finishRideSchema: SchemaObject<FinishRide> = {
  ridePID: "string",
  latLng: positionSchema.latLng,
};
