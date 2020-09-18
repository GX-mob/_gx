import { SchemaObject } from "schemapack";

export type PickingUpPath = {
  ridePID: string;
  path: string;
  duration: number;
};
export const setPickingUpPathSchema: SchemaObject<PickingUpPath> = {
  ridePID: "string",
  path: "string",
  duration: "uint8",
};
