import { SchemaObject } from "../../types/schemapack";

export enum CANCELATION_RESPONSE {
  SAFE = "safe",
  PENDENCIE_ISSUED = "pendencie-issued",
  CHARGE_REQUESTED = "charge-requested",
}

export type CanceledRide = {
  ridePID: string;
  status: CANCELATION_RESPONSE;
};
export const canceledRideSchema: SchemaObject<CanceledRide> = {
  ridePID: "string",
  status: "string",
};
