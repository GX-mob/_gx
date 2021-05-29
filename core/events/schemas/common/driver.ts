
import { IUserBasic } from "./user-basic";
import { IPositionData } from "../position";
import { IConfiguration } from "../configuration";
import { EVehicleTypes } from "domain/vehicle";

export interface IDriverData extends IUserBasic {
  position: IPositionData;
  /**
   * Driver ride match configuration
   */
  config: IConfiguration;
  updatedAt: number;
  vehicleType: EVehicleTypes;
};
