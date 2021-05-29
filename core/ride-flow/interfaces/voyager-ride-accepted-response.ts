import { SchemaObject } from "../../types/schemapack";

export interface IVoyagerRideAcceptedResponse {
  ridePID: string;
  driverPID: string;
  timestamp: number;
};

export const voyagerRideAcceptedResponseSchema: SchemaObject<IVoyagerRideAcceptedResponse> = {
  ridePID: "string",
  driverPID: "string",
  timestamp: "uint32",
};
