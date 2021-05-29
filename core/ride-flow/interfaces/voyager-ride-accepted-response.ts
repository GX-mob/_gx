import { Schema, type } from "@colyseus/schema";

export interface IVoyagerRideAcceptedResponse {
  ridePID: string;
  driverPID: string;
  timestamp: number;
}

export class VoyagerRideAcceptedResponseSchema
  extends Schema
  implements IVoyagerRideAcceptedResponse
{
  @type("string")
  ridePID!: string;

  @type("string")
  driverPID!: string;

  @type("number")
  timestamp!: number;
}
