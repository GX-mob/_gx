import { SchemaObject } from "types/schemapack";

export interface IObserver {
  pid: string;
  p2p: boolean;
}

export const observerSchema: SchemaObject<IObserver> = {
  pid: "string",
  p2p: "boolean",
};
