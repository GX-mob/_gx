export type UserBasic = {
  pid: string;
  firstName: string;
  lastName: string;
  /**
   * Voyager:
   * * 1 = Idle
   * * 2 = Waiting
   * * 3 = Running
   *
   * Driver:
   * * 1 = Idle
   * * 2 = Searching
   * * 3 = Running
   */
  state: 1 | 2 | 3;
  /**
   * User avaliations rate
   */
  rate: number;
  /**
   * User can establish a p2p connection
   */
  p2p: boolean;
};

export default {
  pid: "string",
  firstName: "string",
  lastName: "string",
  state: "uint8",
  rate: "flaot32",
  p2p: "boolean",
};
