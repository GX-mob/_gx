import { SchemaObject } from "../../types/schemapack";

export type PickingUpPath = {
  ridePID: string;
  path: string;
  duration: number;
};
export const pickingUpPathSchema: SchemaObject<PickingUpPath> = {
  ridePID: "string",
  path: "string",
  duration: "uint8",
};
