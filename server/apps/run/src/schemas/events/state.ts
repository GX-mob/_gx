import EVENTS_MAP from "../events-map";
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

export const stateSchema = { state: "int8", id: "string" };

export default {
  id: EVENTS_MAP.STATE.ID,
  schema: stateSchema,
};
