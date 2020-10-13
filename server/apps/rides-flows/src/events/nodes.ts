import { ConnectionData, Driver } from "@shared/events";
import { NAMESPACES } from "../constants";

type ServiceNodeSocketEvent<Struct> = {
  /**
   * The node id of event emissor
   */
  socketId: string;
} & Struct;

export enum NODES_EVENTS {
  UPDATE_DRIVER_STATE = "UPDATE_DRIVER_STATE",
  UPDATE_LOCAL_SOCKET_DATA = "UPDATE_LOCAL_SOCKET_DATA",
  TELL_ME_YOUR_DRIVERS_STATE = "TELL_ME_YOUR_STATE",
}

export type UpdateDriverState = ServiceNodeSocketEvent<{
  state: Partial<Driver>;
}>;

export type UpdateLocalSocketData = ServiceNodeSocketEvent<{
  namespace: NAMESPACES;
  data: Partial<ConnectionData>;
}>;

export type TellMeYourDriversState = {
  drivers: Driver[];
};

export interface NodesEventsInterface {
  [NODES_EVENTS.UPDATE_DRIVER_STATE]: UpdateDriverState;
  [NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA]: UpdateLocalSocketData;
  [NODES_EVENTS.TELL_ME_YOUR_DRIVERS_STATE]: TellMeYourDriversState;
}
