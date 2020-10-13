import { SchemaObject } from "../../types/schemapack";
import { Position, positionSchema } from "./position";

export type StartRide = { ridePID: string; latLng: Position["latLng"] };
export const startRideSchema: SchemaObject<StartRide> = {
  ridePID: "string",
  latLng: positionSchema.latLng,
};
