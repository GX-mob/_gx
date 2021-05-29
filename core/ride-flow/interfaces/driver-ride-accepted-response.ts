import { SchemaObject } from "../../types/schemapack";

export interface IDriverRideAcceptedResponse {
  ridePID: string;
  timestamp: number;
};

export const driverRideAcceptedResponseSchema: SchemaObject<IDriverRideAcceptedResponse> = {
  ridePID: "string",
  timestamp: "uint32",
};
