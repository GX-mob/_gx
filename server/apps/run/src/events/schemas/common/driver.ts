import { UserBasic } from "./user-basic";
import { Position } from "../position";
import { Configuration } from "../configuration";

export enum DriverState {
  IDLE = 1,
  SEARCHING = 2,
  RUNNING = 3,
  RIDE_FINALIZATION_STATE = 4,
}

export type Driver = UserBasic & {
  position: Position;
  /**
   * Driver state list:
   * * undefined | 1 = Idle
   * * 2 = Searching
   * * 3 = Running
   */
  state?: DriverState;
  /**
   * Driver ride match configuration
   */
  config: Configuration;
};
