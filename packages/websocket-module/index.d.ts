import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { Server, ServerOptions, Socket } from "socket.io";
import { Redis } from "ioredis";
import EventEmitter from "eventemitter3";

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
     * Self node id to prevent the handle of self emitted events
     */
    nodeId: string;
    /**
     * Private EventEmitter to internal events
     */
    events: EventEmitter;
    /**
     * Public EventEmitter to listen events between server nodes
     */
    nodes: Pick<EventEmitter, "on"> & {
      /**
       * Emit event to socket.
       *
       * If this server has the socket connected, it self emits the event, otherwise,
       * dispatch the request to the server nodes and the one with the socket emits the event.
       *
       * @param {string} event
       * @param {string} socketId
       * @param {any} data
       * @param {function | true} [ack] Acknowledgment
       */
      emit: (
        event: string,
        socketId: string,
        data: any,
        ack?: ((data: any) => void) | true
      ) => Promise<unknown> | void;
    };
  }
}

export function createServer(
  /**
   * The server to bind to.
   */
  httpServer: HttpServer | HttpsServer,
  config: CreateServerOptions
): Server;

export type CreateServerOptions = {
  redis: string | { pubClient: Redis; subClient: Redis };
  /**
   * SocketIO server options
   */
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
