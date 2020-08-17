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

export default {
  id: 1,
  schema: { state: "int8", id: "string" },
};
