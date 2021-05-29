import { SchemaObject } from "../../types/schemapack";

export interface ICancelRide {
  ridePID: string;
};

export const cancelRideSchema: SchemaObject<ICancelRide> = {
  ridePID: "string",
};
