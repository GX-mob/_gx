import { Redis } from "ioredis";
import { parsers } from "extensor";

export type ConfigOptions = {
  /**
   * List of events that are auto broadcasted to another server nodes
   */
  broadcastedEvents: string[];
  redis: string | { pubClient: Redis; subClient: Redis };
  ackTimeout?: number;
  parser: ReturnType<typeof parsers.schemapack>;
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
