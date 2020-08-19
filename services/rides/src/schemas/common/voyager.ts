import { UserBasic } from "./user-basic";

export type Voyager = UserBasic & {
  /**
   * To allow the voyager can creates multiple rides
   */
  rides: any[];
};
