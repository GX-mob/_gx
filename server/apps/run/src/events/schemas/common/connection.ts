import { Configuration } from "../configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";
import { Ride } from "@app/database";

export type Connection = UserBasic & {
  /**
   * Sockets that observe some events of this socket
   */
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  /**
   * Current rides
   * * Voyager only
   */
  rides?: Ride["pid"][];
  /**
   * Driver state
   * * Driver only
   */
  state?: Driver["state"];
};
