import { Schema, type } from "@colyseus/schema";

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
}

export interface ISendableUserData
  extends Pick<IUserBasic, "pid" | "p2p" | "rate"> {}

export class UserSendableDataSchema
  extends Schema
  implements ISendableUserData
{
  @type("string")
  pid!: string;

  @type("boolean")
  p2p!: boolean;

  @type("number")
  rate!: number;
}

export class UserDataSchema
  extends UserSendableDataSchema
  implements IUserBasic
{
  @type("string")
  _id!: string;

  @type("string")
  pid!: string;

  @type("boolean")
  p2p!: boolean;

  @type("number")
  rate!: number;

  @type("string")
  state!: EUserState;

  @type("string")
  socketId!: string;
}
