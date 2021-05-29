import { SchemaObject } from "../../types/schemapack";
import { IPositionData, positionSchema } from "./position";

export interface IStartRide {
  ridePID: string;
  latLng: IPositionData["latLng"];
}

export const startRideSchema: SchemaObject<IStartRide> = {
  ridePID: "string",
  latLng: positionSchema.latLng,
};
