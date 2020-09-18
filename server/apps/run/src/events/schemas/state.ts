import { SchemaObject } from "schemapack";

/**
 * User state event schema
 */
export type State = {
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

export const stateSchema: SchemaObject<State> = {
  state: "int8",
  pid: "string",
};
