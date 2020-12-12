import { Redis } from "ioredis";
import { parsers } from "extensor";
import { ValueOf } from "@shared/types/helpers";
import { MODULE_COMMUNICATION_EVENTS } from "./constants";

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

export type ServerEvent<EVENTS_LIST> = {
  event: EVENTS_LIST;
  nodeId: string;
  content: any;
};

export type DispatchedEvent<Data = any, Event = any> = {
  socketId: string;
  event: Event;
  data: Data;
  ack: unknown;
};

export interface IDispatchedSocketEvent<Events> {
  socketId: string;
  event: keyof Events;
  data: ValueOf<Events>;
  ack: boolean;
}

export interface ISocketNodeEvent<ServerNodesEvents> {
  event: keyof ServerNodesEvents;
  data: ValueOf<ServerNodesEvents>;
}

export interface IDispatchedBroadcastedEvent {
  socketId: string;
  event: string;
  data: unknown;
}

export interface IModuleCommunicationEvents<ClientEvents, ServerNodesEvents> {
  [MODULE_COMMUNICATION_EVENTS.DISPATCHED_SOCKET_EVENT]: IDispatchedSocketEvent<
    ClientEvents
  >;
  [MODULE_COMMUNICATION_EVENTS.SOCKET_NODE_EVENT]: ISocketNodeEvent<
    ServerNodesEvents
  >;
  [MODULE_COMMUNICATION_EVENTS.DISPATCHED_BROADCASTED_EVENT]: IDispatchedBroadcastedEvent;
}
