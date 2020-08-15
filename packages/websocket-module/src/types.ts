import { Server, ServerOptions, Socket } from "socket.io";
import { Redis } from "ioredis";
import EventEmitter from "eventemitter3";

export type CreateServerOptions = {
  redis: string | { pubClient: Redis; subClient: Redis };
  options?: ServerOptions;
  /**
   * List of events that are auto broadcasted to another server nodes
   */
  broadcastedEvents: string[];
};

export type BroadcastEventsSetup = {
  server: Server;
  socket: Socket;
  events: CreateServerOptions["broadcastedEvents"];
};

declare module "socket.io" {
  interface Adapter {
    customRequest(
      data: any,
      callback?: (err: any, replies: any[]) => void
    ): void;
    customHook: (data: any, callback: (data: any) => void) => void;
  }

  interface Server {
    /**
     * Private EventEmitter to internal events
     */
    events: EventEmitter;
    /**
     * Public EventEmitter to listen events between server nodes
     */
    nodes: Pick<EventEmitter, "on">;
    /**
     * Emitt event to a socket
     */
    emitTo(socketId: string, event: string, data: any): void;
  }
}
