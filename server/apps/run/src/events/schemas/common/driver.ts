import { UserBasic } from "./user-basic";
import { Position } from "../position";
import { Configuration } from "../configuration";

export type Driver = UserBasic & {
  position: Position;
  /**
   * Driver state list:
   * * undefined | 1 = Idle
   * * 2 = Searching
   * * 3 = Running
   */
  state?: 1 | 2 | 3;
  /**
   * Driver ride match configuration
   */
  config: Configuration;
};
