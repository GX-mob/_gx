import { Redis } from "ioredis";
import { parsers } from "extensor";

export type ConfigOptions = {
  /**
   * List of events that are auto broadcasted to another server nodes
   */
  broadcastedEvents: {
    [namespace: string]: string[];
  };
  redis: string | { pubClient: Redis; subClient: Redis };
  ackTimeout?: number;
  parser: ReturnType<typeof parsers.schemapack>;
};

export type ServerEvent = {
  event: string;
  nodeId: string;
  content: any;
};

export type DispatchedEvent<Data = any, Event = any> = {
  socketId: string;
  event: Event;
  data: Data;
  ack: unknown;
};

export type Callback = (...args: any) => void;
