import { UserBasic } from "./user-basic";
import { Position } from "../events/position";
import { Configuration } from "../events/configuration";

export type Driver = UserBasic & {
  /**
   * Driver state list:
   * * undefined | 1 = Idle
   * * 2 = Searching
   * * 3 = Running
   */
  state?: 1 | 2 | 3;
  position: Position;
} & {
  /**
   * Driver ride match configuration
   */
  config: Configuration;
};
