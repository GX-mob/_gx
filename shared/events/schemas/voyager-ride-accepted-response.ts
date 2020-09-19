import { SchemaObject } from "schemapack";

export type VoyagerRideAcceptedResponse = {
  ridePID: string;
  driverPID: string;
  timestamp: number;
};

export const voyagerRideAcceptedResponseSchema: SchemaObject<VoyagerRideAcceptedResponse> = {
  ridePID: "string",
  driverPID: "string",
  timestamp: "uint32",
};
