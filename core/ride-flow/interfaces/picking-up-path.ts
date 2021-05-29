import { SchemaObject } from "../../types/schemapack";

export type IGetOverHere = {
  ridePID: string;
  path: string;
  duration: number;
};

export const getOverHereSchema: SchemaObject<IGetOverHere> = {
  ridePID: "string",
  path: "string",
  duration: "uint8",
};
