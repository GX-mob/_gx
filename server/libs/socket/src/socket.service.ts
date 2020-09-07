import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Server, Adapter } from "socket.io";
import redisIoAdapter from "socket.io-redis";
import shortid from "shortid";
import EventEmitter from "eventemitter3";
import { ConfigOptions, ServerEvent, DispatchedEvent, Callback } from "./types";
import { OPTIONS_KEY, SERVER_EVENTS, DEFAULT_ACK_TIMEOUT } from "./constants";

@Injectable()
export class SocketService {
  /**
   * Self node id to used prevent handling self emitted events
   */
  readonly nodeId = shortid.generate();
  readonly nodesEmitter: EventEmitter = new EventEmitter();
  public server!: Server;
  private adapter!: Adapter;

  constructor(
    private config: ConfigService,
    @Inject(OPTIONS_KEY) private options: ConfigOptions,
  ) {}

  configureServer(server: Server) {
    this.server = server;

    const redisUri = this.config.get("REDIS_URI") as string;
    const redisAdapter = redisIoAdapter(redisUri);
    server.adapter(redisAdapter);

    this.adapter = server.of("/").adapter;

    // TODO configure parser

    this.registerServerEventsListener();
    this.configureEventsMiddleware();
  }

  /**
   * Register listener to broadcasted events
   * @param event
   * @param listener
   */
  protected on(
    event: string,
    listener: (
      content: Omit<DispatchedEvent, "event">,
      acknowledgment?: Callback,
    ) => void,
  ) {
    this.nodesEmitter.on(event, listener);
  }

  private registerServerEventsListener() {
    /**
     * Register server events listener
     */
    this.adapter.customHook = (packet: ServerEvent, cb: Callback) => {
      const { event, nodeId, content } = packet;

      // ignore self emited events
      if (nodeId === this.nodeId) {
        return cb(null);
      }

      switch (event) {
        case SERVER_EVENTS.DISPATCHED_BROADCASTED_EVENT:
          this.nodesEmitter.emit(content.event, content);
          return cb(true);
        case SERVER_EVENTS.DISPATCHED_SOCKET_EVENT:
          return this.handleDispatchedSocketEvent(content, cb);
      }

      cb(null);
    };
  }

  private handleDispatchedSocketEvent(content: DispatchedEvent, cb: Callback) {
    const { socketId, event, data, ack } = content;
    if (!(socketId in this.server.sockets.connected)) {
      return cb(null);
    }
    const socket = this.server.sockets.connected[socketId];

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

  /**
   * Emit event to socket.
   *
   * If this server has the socket connection, it self emits the event, otherwise,
   * dispatch to the servers nodes and the one with the socket emits the event.
   *
   * @param {string} event
   * @param {string} socketId
   * @param {any} data
   * @param {function | true} [ack] Acknowledgment
   */
  emit(socketId: string, event: string, data: any, callback?: Callback) {
    const { connected } = this.server.sockets;
    if (socketId in connected) {
      return connected[socketId].emit(event, data, callback);
    }

    this.dispatchSocketEvent(socketId, event, data, callback);
  }

  private dispatchSocketEvent(
    socketId: string,
    event: string,
    data: any,
    callback?: Callback,
  ) {
    const serverEvent = this.createServerEvent(
      SERVER_EVENTS.DISPATCHED_SOCKET_EVENT,
      {
        socketId,
        event,
        data,
      },
    );

    this.adapter.customRequest(serverEvent, (err, replies) => {
      if (err) {
      }

      callback && callback(replies.find((value) => value));
    });
  }

  private createServerEvent(event: SERVER_EVENTS, content: any): ServerEvent {
    return {
      nodeId: this.nodeId,
      event,
      content,
    };
  }

  /**
   * Registry events middleware to broadcast configured events
   */
  private configureEventsMiddleware() {
    this.server.use((socket, next) => {
      socket.use((packet, next) => {
        const [event, data] = packet;

        if (this.options.broadcastedEvents.includes(event)) {
          this.dispatchBroadcastedEvent({
            socketId: socket.id,
            event,
            data,
          });
        }

        next();
      });
      next();
    });
  }

  private dispatchBroadcastedEvent(packet: any) {
    const serverEvent = this.createServerEvent(
      SERVER_EVENTS.DISPATCHED_BROADCASTED_EVENT,
      packet,
    );

    this.adapter.customRequest(serverEvent, (err, replies) => {});
  }
}

declare module "socket.io" {
  interface Adapter {
    customRequest(
      data: any,
      callback?: (err: any, replies: any[]) => void,
    ): void;
    customHook: (data: any, callback: (data: any) => void) => void;
  }
}
