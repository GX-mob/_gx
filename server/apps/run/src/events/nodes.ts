import { ConnectionData, Driver } from ".";
import { NAMESPACES } from "../constants";

export enum NODES_EVENTS {
  UPDATE_DRIVER_STATE = "UPDATE_DRIVER_STATE",
  UPDATE_LOCAL_SOCKET_DATA = "UPDATE_LOCAL_SOCKET_DATA",
}

export type UpdateDriverState = {
  socketId: string;
  state: Partial<Driver>;
};

export type UpdateLocalSocketData = {
  socketId: string;
  namespace: NAMESPACES;
  data: Partial<ConnectionData>;
};

export interface NodesEventsInterface {
  [NODES_EVENTS.UPDATE_DRIVER_STATE]: UpdateDriverState;
  [NODES_EVENTS.UPDATE_LOCAL_SOCKET_DATA]: UpdateLocalSocketData;
}
