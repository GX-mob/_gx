import { Configuration } from "../events/configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";
import { Models } from "@gx-mob/http-service";
import { USERS_ROLES } from "@app/database";

export type Connection = UserBasic & {
  /**
   * Usage mode
   * * 1 = Voyager
   * * 2 = Driver
   */
  mode: USERS_ROLES;
  /**
   * Sockets that observe some events of this socket
   */
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  rides?: Models.Ride[];
  state?: Driver["state"];
};
