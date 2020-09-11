import { positionSchema, Position } from "./position";
import { configurationSchema, Configuration } from "./configuration";

export type Setup = {
  position: Position;
  config: Configuration;
};

export const driverSetupSchema = {
  position: positionSchema,
  configuration: configurationSchema,
};
