import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Server } from "socket.io";
import shortid from "shortid";
import EventEmitter from "eventemitter3";
import { DEFAULT_ACK_TIMEOUT } from "./constants";

type ConfigOptions = {
  /**
   * List of events that are auto broadcasted to another server nodes
   */
  broadcastedEvents: string[];
  ackTimeout: number;
};

type InternalEvent = {
  event: string;
  nodeId: string;
  content: any;
};

type DispatchedEvent = {
  id: number;
  event: string;
  data: any;
  ack: unknown;
};

type Callback = (...args: any) => void;

@Injectable()
export class SocketService {
  readonly nodeId = shortid.generate();
  readonly nodesEmitter: EventEmitter = new EventEmitter();
  private internalEmitter: EventEmitter = new EventEmitter();
  public server!: Server;
  public options!: ConfigOptions;

  constructor(readonly config: ConfigService) {}

  configureServer(server: Server, options: ConfigOptions) {
    this.options = options;
    this.server = server;
    // server.nodeId = shortid.generate();

    this.configureInternalEvents();
  }

  configureInternalEvents() {
    const { adapter } = this.server.of("/");

    /**
     * Register event listener
     */
    adapter.customHook = (packet: InternalEvent, cb: Callback) => {
      const { event, nodeId, content } = packet;

      if (nodeId === this.nodeId) {
        return cb(null);
      }

      switch (event) {
        case "dispatchBroadcastedEvent":
          this.nodesEmitter.emit(content.event, content);
          return cb(true);
        case "dispatchSocketEvent":
          return this.handleDispatchedEvent(content, cb);
      }

      cb(null);
    };

    /**
     * Setup event emitter
     */

    this.internalEmitter.on("dispatchBroadcastedEvent", (packet: any) => {
      const event = this.createInternalEvent(
        "dispatchBroadcastedEvent",
        packet,
      );

      adapter.customRequest(event, (err, replies) => {});
    });

    this.internalEmitter.on(
      "dispatchSocketEvent",
      (content: any, callback: (data: any) => void) => {
        const event = this.createInternalEvent("dispatchSocketEvent", content);

        adapter.customRequest(event, (err, replies) => {
          if (err) {
          }

          callback && callback(replies.find((value) => value));
        });
      },
    );
  }

  createInternalEvent(event: string, content: any): InternalEvent {
    return {
      nodeId: this.nodeId,
      event,
      content,
    };
  }

  handleDispatchedEvent(content: DispatchedEvent, cb: Callback) {
    const { id, event, data, ack } = content;
    if (!(id in this.server.sockets.connected)) {
      return cb(null);
    }
    const socket = this.server.sockets.connected[id];

    if (!ack) {
      socket.emit(event, data);

      return cb(true);
    }

    const responseAckTimeout = setTimeout(
      (cb) => cb("ackTimeout"),
      this.options.ackTimeout || DEFAULT_ACK_TIMEOUT,
      cb,
    );

    socket.emit(event, data, (response: any) => {
      clearTimeout(responseAckTimeout);
      cb(response);
    });
  }

  configureInternalEventsEmitter() {}
}

declare module "socket.io" {
  interface Adapter {
    customRequest(
      data: any,
      callback?: (err: any, replies: any[]) => void,
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
    internalEvents: EventEmitter;
    /**
     * Public EventEmitter to listen client events and emit events between server nodes
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
        ack?: ((data: any) => void) | true,
      ) => Promise<unknown> | void;
    };
  }
}
