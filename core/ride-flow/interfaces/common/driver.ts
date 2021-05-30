import { type } from "@colyseus/schema";
import { EVehicleTypes } from "../../../domain/vehicle";
import { ConfigurationSchema, IConfiguration } from "../configuration";
import { IPositionData, PositionSchema } from "../position";
import { IUserBasic, UserDataSchema } from "./user-basic";

export interface IDriverData extends IUserBasic {
  position: IPositionData;
  /**
   * Driver ride match configuration
   */
  config: IConfiguration;
  updatedAt: number;
  vehicleType: EVehicleTypes;
}

export class DriverDataSchema extends UserDataSchema implements IDriverData {
  @type(PositionSchema)
  position!: PositionSchema;

  @type(ConfigurationSchema)
  config!: ConfigurationSchema;

  @type("number")
  updatedAt!: number;

  @type("string")
  vehicleType!: EVehicleTypes;
}
