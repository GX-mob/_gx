import { Schema, type } from "@colyseus/schema";

export interface IDriverRideAcceptedResponse {
  ridePID: string;
  timestamp: number;
}

export class DriverRideAcceptedResponseSchema
  extends Schema
  implements IDriverRideAcceptedResponse
{
  @type("string")
  ridePID!: string;

  @type("number")
  timestamp!: number;
}
