import { Configuration } from "../events/configuration";
import { UserBasic } from "./user-basic";
import { Driver } from "./driver";

export type Connection = UserBasic & {
  observers: { socketId: string; p2p: boolean }[];
  config?: Configuration;
  state?: Driver["state"];
};
