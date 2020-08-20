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
   * SocketId
   * * Server only
   */
  socketId: string;
};

export default {
  pid: "string",
  firstName: "string",
  lastName: "string",
  rate: "flaot32",
  p2p: "boolean",
};
