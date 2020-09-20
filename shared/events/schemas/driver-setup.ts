import { SchemaObject } from "schemapack";
import { positionSchema, Position } from "./position";
import { configurationSchema, Configuration } from "./configuration";

export type Setup = {
  position: Position;
  config: Configuration;
  vehicleId: string;
};

export const driverSetupSchema: SchemaObject<Setup> = {
  position: positionSchema,
  config: configurationSchema,
  vehicleId: "string",
};
