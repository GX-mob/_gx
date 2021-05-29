import { IConnectionData, IDriverData } from "@core/ride-flow/events";
import { GatewayNamespaces } from "../constants";

interface IServiceNodeBroadcastedSocketEvent {
  /**
   * The server node id of event emissor
   */
  socketId: string;
}

export enum EServerNodesEvents {
  PutDriverState,
  UpdateDriverState,
  UpdateLocalAccountData,
  TellMeYourDriversState,
}

export interface IPutDriverState extends IServiceNodeBroadcastedSocketEvent {
  state: IDriverData;
}

export interface IUpdateDriverState extends IServiceNodeBroadcastedSocketEvent {
  state: Partial<IDriverData>;
}

export interface IUpdateLocalSocketData
  extends IServiceNodeBroadcastedSocketEvent {
  namespace: GatewayNamespaces;
  data: Partial<IConnectionData>;
}

export type TellMeYourDriversState = {
  drivers: IDriverData[];
};

export interface INodesEvents {
  [EServerNodesEvents.PutDriverState]: IPutDriverState;
  [EServerNodesEvents.UpdateDriverState]: IUpdateDriverState;
  [EServerNodesEvents.UpdateLocalAccountData]: IUpdateLocalSocketData;
  [EServerNodesEvents.TellMeYourDriversState]: TellMeYourDriversState;
}
