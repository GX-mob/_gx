import { SchemaObject } from "schemapack";

export type SetPickingUpPath = {
  ridePID: string;
  path: string;
  duration: number;
};
export const setPickingUpPathSchema: SchemaObject<SetPickingUpPath> = {
  ridePID: "string",
  path: "string",
  duration: "uint8",
};
