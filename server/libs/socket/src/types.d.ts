import { ParserMapSchemas } from "extensor/dist/types";

export type ConfigOptions = {
  /**
   * List of events that are auto broadcasted to another server nodes
   */
  broadcastedEvents: string[];
  ackTimeout: number;
  schemas?: ParserMapSchemas;
};

export type ServerEvent = {
  event: string;
  nodeId: string;
  content: any;
};

export type DispatchedEvent = {
  socketId: number;
  event: string;
  data: any;
  ack: unknown;
};

export type Callback = (...args: any) => void;
