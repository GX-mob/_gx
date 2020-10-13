import { Configuration } from "../configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";
import { UserRoles } from "../../../interfaces";

export type ConnectionData = UserBasic & {
  mode: UserRoles;
  /**
   * Sockets that observe some events of this socket
   */
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  /**
   * Running user rides
   */
  rides: string[];
  /**
   * Driver state
   * * Driver only
   */
  state?: Driver["state"];
};
