/**
 * User state event schema
 */
export type State = {
  /**
   * State:
   * * 1 = Online
   * * 2 = Away
   */
  state: 1 | 2;
  /**
   * User id
   */
  id: string;
};

export default {
  id: 1,
  schema: { state: "int8", id: "string" },
};
