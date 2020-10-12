import { SchemaObject } from "../../../types/schemapack";

export enum UserState {
  IDLE = 1,
  SEARCHING = 2,
  PICKING_UP = 3,
  RUNNING = 4,
  COMPLETING = 5,
}

export type UserBasic = {
  /**
   * User internal id
   */
  _id: string;
  /**
   * User public id
   */
  pid: string;
  /**
   * User average avaliations rate
   */
  rate: number;
  /**
   * User can establish a p2p connection
   */
  p2p: boolean;
  /**
   * User ride state;
   * IDLE = 1;
   * SEARCHING = 2; Seargin ride/ Searcing driver
   * PICKING_UP = 3;
   * RUNNING = 4;
   * COMPLETING = 5;
   */
  state: UserState;
  /**
   * SocketId
   * * Server only
   */
  socketId: string;
};

export type SendableUserData = Pick<UserBasic, "pid" | "p2p">;

export const userSchema: SchemaObject<SendableUserData> = {
  pid: "string",
  p2p: "bool",
};
