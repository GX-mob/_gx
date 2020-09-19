import { UserBasic, UserState } from "./user-basic";
import { Position } from "../position";
import { Configuration } from "../configuration";

export const DriverState = UserState;

export type Driver = UserBasic & {
  position: Position;
  /**
   * Driver ride match configuration
   */
  config: Configuration;
};
