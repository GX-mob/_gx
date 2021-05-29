import { Schema, type } from "@colyseus/schema";

export interface IObserver {
  pid: string;
  p2p: boolean;
}

export class ObserverSchema extends Schema implements IObserver {
  @type("string")
  pid!: string;

  @type("boolean")
  p2p!: boolean;
}
