import { Driver } from ".";

export enum NODES_EVENTS {
  UPDATE_DRIVER_STATE = "UPDATE_DRIVER_STATE",
}

export type UpdateDriverState = {
  socketId: string;
  state: Partial<Driver>;
};
