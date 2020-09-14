import { Configuration } from "../configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";
import { Ride, USERS_ROLES } from "@app/repositories";

export type ConnectionData = UserBasic & {
  mode: USERS_ROLES;
  /**
   * Sockets that observe some events of this socket
   */
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  /**
   * Running user rides
   */
  rides: Ride["pid"][];
  /**
   * Driver state
   * * Driver only
   */
  state?: Driver["state"];
};
