import { SchemaObject } from "../../types/schemapack";

/**
 * User state event schema
 */
export interface IState {
  /**
   * State:
   * * 0 = Offline
   * * 1 = Online
   * * 2 = Away
   */
  state: 0 | 1 | 2;
  /**
   * User id
   */
  pid: string;
};

export const stateSchema: SchemaObject<IState> = {
  state: "int8",
  pid: "string",
};
