import { Schema, type } from "@colyseus/schema";
import { ConfigurationSchema, IConfiguration } from "./configuration";
import { IPositionData, PositionSchema } from "./position";

export interface ISetup {
  position: IPositionData;
  config: IConfiguration;
  vehicleId: string;
}

export class DriverSetupSchema extends Schema implements ISetup {
  @type(PositionSchema)
  position!: PositionSchema;

  @type(ConfigurationSchema)
  config!: ConfigurationSchema;

  @type("string")
  vehicleId!: string;
}
