import { SchemaObject } from "../../types/schemapack";
import { positionSchema, IPositionData } from "./position";
import { configurationSchema, IConfiguration } from "./configuration";

export interface ISetup {
  position: IPositionData;
  config: IConfiguration;
  vehicleId: string;
};

export const driverSetupSchema: SchemaObject<ISetup> = {
  position: positionSchema,
  config: configurationSchema,
  vehicleId: "string",
};
