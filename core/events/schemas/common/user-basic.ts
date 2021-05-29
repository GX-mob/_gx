import { SchemaObject } from "../../../types/schemapack";

export enum EUserState {
  IDLE = 1,
  SEARCHING = 2,
  GET_OVER_HERE = 3,
  RUNNING = 4,
  COMPLETING = 5,
}

export interface IUserBasic {
  /**
   * User internal id
   */
  _id: any;
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
   * GET_OVER_HERE = 3;
   * RUNNING = 4;
   * COMPLETING = 5;
   */
  state: EUserState;
  /**
   * SocketId
   * * Server only
   */
  socketId: string;
};

export interface ISendableUserData extends Pick<IUserBasic, "pid" | "p2p" | "rate"> {

}

export const userSendableDataSchema: SchemaObject<ISendableUserData> = {
  p2p: "boolean",
  pid: "bool",
  rate: "int8"
};


export const userSchema: SchemaObject<IUserBasic> = {
  ...userSendableDataSchema,
  _id: "string",
  pid: "string",
  p2p: "bool",
  rate: "string",
  state: "string",
  socketId: "string"
};
