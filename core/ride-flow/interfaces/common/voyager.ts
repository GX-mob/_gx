import { IUserBasic } from "./user-basic";

export interface IVoyager extends IUserBasic {
  /**
   * To allow the voyager creates simultaneous rides
   */
  rides: any[];
};
