import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import Redis from "ioredis";
import { Server, Adapter, Socket, Namespace } from "socket.io";
import redisIoAdapter from "socket.io-redis";
import { ParsersList } from "extensor/dist/types";
import shortid from "shortid";
import EventEmitter from "eventemitter3";
import {
  ConfigOptions,
  ServerEvent,
  DispatchedEvent,
  IModuleCommunicationEvents,
  IDispatchedBroadcastedEvent,
} from "./types";
import { MODULE_COMMUNICATION_EVENTS, DEFAULT_ACK_TIMEOUT } from "./constants";
import { Callback } from "@core/types/helpers";

@Injectable()
export class SocketService<
  ClientEvents = Record<string, any>,
  ServerNodesEvents = Record<string, any>
> {
  /**
   * Self node id to used prevent handling self emitted events
   */
  public nodeId = shortid.generate();
  private broadcastedListener = new EventEmitter();
  private nodeListener = new EventEmitter();
  public serviceEvents = new EventEmitter();
  readonly nodes = {
    /**
     * Registres a event listener from another server nodes
     */
    on: <K extends keyof ServerNodesEvents>(
      event: K,
      listener: (
        data: ServerNodesEvents[K],
        acknow: (data: ServerNodesEvents[K] | true) => void,
      ) => void,
    ) =>
      this.nodeListener.on(event as string, ({ data, ack }: any) => {
        listener(data, ack);
      }),
    /**
     * Emits events to another server nodes
     */
    emit: <K extends keyof ServerNodesEvents>(
      event: K,
      data: ServerNodesEvents[K],
      acknowledgment?: (response: (ServerNodesEvents[K] | null)[]) => void,
    ) => {
      const serverEvent = this.createServerEvent(
        MODULE_COMMUNICATION_EVENTS.SOCKET_NODE_EVENT,
        {
          event,
          data,
        },
      );

      this.adapter.customRequest(serverEvent, (err, replies) => {
        if (err) {
          this.logger.error(err);
        }

        return acknowledgment && acknowledgment(replies);
      });
    },
  };
  public server!: Server;
  public schemas!: ParsersList;
  private adapter!: Adapter;
  private options!: ConfigOptions;

  constructor(readonly logger: PinoLogger) {
    logger.setContext(SocketService.name);
  }

  configureServer(server: Server, options: ConfigOptions) {
    this.server = server;
    this.options = options;
    this.schemas = options.parser.schemas;

    const redisAdapterConfigure =
      typeof options.redis === "string"
        ? {
            pubClient: new Redis(options.redis),
            subClient: new Redis(options.redis),
          }
        : options.redis;
    const redisAdapter = redisIoAdapter(redisAdapterConfigure);

    server.adapter(redisAdapter);
    this.adapter = server.of("/").adapter;
    this.registerServerEventsListener();
    this.configureEventsMiddleware();
    this.serviceEvents.emit("serviceConfigured");
  }

  /**
   * Registres a listener of broadcasted events
   * @param event
   * @param listener
   */
  public on<K extends keyof ClientEvents>(
    event: K,
    listener: (
      content: Omit<DispatchedEvent<ClientEvents[K]>, "event">,
      acknowledgment?: Callback,
    ) => void,
  ) {
    this.broadcastedListener.on(event as string, listener);
  }

  private registerServerEventsListener() {
    /**
     * Register server events listener
     */
    this.adapter.customHook = (
      packet: ServerEvent<MODULE_COMMUNICATION_EVENTS>,
      cb: Callback,
    ) => {
      const { event, nodeId, content } = packet;

      if (nodeId === this.nodeId) {
        return cb(null);
      }

      switch (event) {
        case MODULE_COMMUNICATION_EVENTS.DISPATCHED_BROADCASTED_EVENT:
          this.broadcastedListener.emit(content.event, content);
          return cb(true);
        case MODULE_COMMUNICATION_EVENTS.DISPATCHED_SOCKET_EVENT:
          return this.handleDispatchedSocketEvent(content, cb);
        case MODULE_COMMUNICATION_EVENTS.SOCKET_NODE_EVENT:
          const acknowledgmentTimeout = setTimeout(() => {
            cb(null);
          }, 3000);
          this.nodeListener.emit(content.event, {
            data: content.data,
            ack: (ackData: any) => {
              clearTimeout(acknowledgmentTimeout);
              cb(ackData);
            },
          });

          return;
      }

      cb(null);
    };
  }

  private handleDispatchedSocketEvent(content: DispatchedEvent, cb: Callback) {
    const { socketId, event, data, ack } = content;
    const socket = this.getSocket(socketId);

    if (!socket) {
      return cb(null);
    }

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
   * Emits event to socket.
   *
   * If this node has the socket connection, it self emits the event, otherwise,
   * dispatch to the others nodes and the one with the socket emits the event.
   *
   * @param {string} event
   * @param {string} socketId
   * @param {any} data
   * @param {function | true} [ack] Acknowledgment
   */
  emit<K extends keyof ClientEvents>(
    socketId: string,
    event: K,
    data: ClientEvents[K],
    callback?: Callback,
  ) {
    const socket = this.getSocket(socketId);

    if (!socket) {
      return this.dispatchSocketEvent(socketId, event, data, callback);
    }

    return (socket as any).emit(event, data, callback);
  }

  /**
   * Emits event to socket.
   *
   * If this node has the socket connection, it self emits the event, otherwise,
   * dispatch to the others nodes and the one with the socket emits the event.
   *
   * @param {string} event
   * @param {string} socketId
   * @param {any} data
   * @param {function | true} [ack] Acknowledgment
   */
   emitByPid<K extends keyof ClientEvents>(
    socketId: string,
    event: K,
    data: ClientEvents[K],
    callback?: Callback,
  ) {
    const socket = this.getSocket(socketId);

    if (!socket) {
      return this.dispatchSocketEvent(socketId, event, data, callback);
    }

    return (socket as any).emit(event, data, callback);
  }

  getSocket(id: string): Socket | null {
    const split = id.split("#");

    if (split.length === 1) {
      return this.server.of("/").sockets[id] || null;
    }

    const [namespace] = split;

    return this.server.of(namespace).sockets[id] || null;
  }

  private dispatchSocketEvent<K extends keyof ClientEvents>(
    socketId: string,
    event: K,
    data: ClientEvents[K],
    callback?: Callback,
  ) {
    const serverEvent = this.createServerEvent(
      MODULE_COMMUNICATION_EVENTS.DISPATCHED_SOCKET_EVENT,
      {
        socketId,
        event,
        data,
        ack: !!callback,
      },
    );

    this.adapter.customRequest(serverEvent, (err, replies) => {
      if (err) {
        this.logger.error(err);
      }

      callback && callback(replies.find((value) => value));
    });
  }

  private createServerEvent<
    K extends keyof IModuleCommunicationEvents<ClientEvents, ServerNodesEvents>
  >(
    event: K,
    content: IModuleCommunicationEvents<ClientEvents, ServerNodesEvents>[K],
  ): ServerEvent<K> {
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
    for (let namespace in this.options.broadcastedEvents) {
      this.configureMiddleware(
        this.server.of(namespace),
        this.options.broadcastedEvents[namespace],
      );
    }
  }

  private configureMiddleware(
    namespace: Namespace,
    broadcastedEvents: string[],
  ) {
    namespace.use((socket, next) => {
      socket.use((packet, next) => {
        const [event, data] = packet;

        if (broadcastedEvents.includes(event)) {
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

  private dispatchBroadcastedEvent(packet: IDispatchedBroadcastedEvent) {
    const serverEvent = this.createServerEvent(
      MODULE_COMMUNICATION_EVENTS.DISPATCHED_BROADCASTED_EVENT,
      packet,
    );

    this.adapter.customRequest(serverEvent, (err, replies) => {});
  }
}

declare module "socket.io" {
  interface Adapter {
    customRequest(
      data: ServerEvent<MODULE_COMMUNICATION_EVENTS>,
      callback?: (err: any, replies: any[]) => void,
    ): void;
    customHook: (data: any, callback: (data: any) => void) => void;
  }
}
