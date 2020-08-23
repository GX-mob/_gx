import { Configuration } from "../events/configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";
import { Models } from "@gx-mob/http-service";

export type Connection = UserBasic & {
  /**
   * Usage mode
   * * 1 = Voyager
   * * 2 = Driver
   */
  mode: 1 | 2;
  /**
   * Sockets that observe some events of this socket
   */
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  rides?: Models.Ride[];
  state?: Driver["state"];
};
