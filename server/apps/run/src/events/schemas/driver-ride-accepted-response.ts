import { SchemaObject } from "schemapack";

export type DriverRideAcceptedResponse = {
  ridePID: string;
  timestamp: number;
};

export const driverRideAcceptedResponseSchema: SchemaObject<DriverRideAcceptedResponse> = {
  ridePID: "string",
  timestamp: "uint32",
};
