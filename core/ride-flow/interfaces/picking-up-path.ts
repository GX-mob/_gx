import { Schema, type } from "@colyseus/schema";

export interface IGetOverHere {
  ridePID: string;
  path: string;
  duration: number;
}

export class GetOverHereSchema extends Schema implements IGetOverHere {
  @type("string")
  ridePID!: string;

  @type("string")
  path!: string;

  @type("number")
  duration!: number;
}
