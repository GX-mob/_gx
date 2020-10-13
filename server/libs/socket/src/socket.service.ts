import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import Redis from "ioredis";
import { Server, Adapter, Socket, Namespace } from "socket.io";
import redisIoAdapter from "socket.io-redis";
import { ParsersList } from "extensor/dist/types";
import shortid from "shortid";
import EventEmitter from "eventemitter3";
import { ConfigOptions, ServerEvent, DispatchedEvent, Callback } from "./types";
import { SERVER_EVENTS, DEFAULT_ACK_TIMEOUT } from "./constants";

@Injectable()
export class SocketService<
  Events = { [k: string]: any },
  NodesEvents = { [k: string]: any }
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
    on: <K extends keyof NodesEvents>(
      event: K,
      listener: (
        data: NodesEvents[K],
        acknow: (data: NodesEvents[K] | true) => void,
      ) => void,
    ) =>
      this.nodeListener.on(event as string, ({ data, ack }: any) => {
        listener(data, ack);
      }),
    /**
     * Emits events to another server nodes
     */
    emit: <K extends keyof NodesEvents>(
      event: K,
      data: NodesEvents[K],
      acknowledgment?: (response: (NodesEvents[K] | null)[]) => void,
    ) => {
      const serverEvent = this.createServerEvent(
        SERVER_EVENTS.SOCKET_NODE_EVENT,
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
  public on<K extends keyof Events>(
    event: K,
    listener: (
      content: Omit<DispatchedEvent<Events[K]>, "event">,
      acknowledgment?: Callback,
    ) => void,
  ) {
    this.broadcastedListener.on(String(event), listener);
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
          this.broadcastedListener.emit(content.event, content);
          return cb(true);
        case SERVER_EVENTS.DISPATCHED_SOCKET_EVENT:
          return this.handleDispatchedSocketEvent(content, cb);
        case SERVER_EVENTS.SOCKET_NODE_EVENT:
          const acknowledgmentTimeout = setTimeout(() => {
            cb(true);
          }, 3000);
          this.nodeListener.emit(content.event, {
            data: content.data,
            ack: (ackData: any) => {
              clearTimeout(acknowledgmentTimeout);
              cb(ackData);
            },
          });

          return;
        /*
          this.nodeListener.emit(
            content.event,
            content.data,
            (data: any) => {},
          );
          return cb(true);*/
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
  emit<K extends keyof Events>(
    socketId: string,
    event: K,
    data: Events[K],
    callback?: Callback,
  ) {
    const socket = this.getSocket(socketId);

    if (!socket) {
      return this.dispatchSocketEvent(
        socketId,
        event as string,
        data,
        callback,
      );
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
      data: ServerEvent,
      callback?: (err: any, replies: any[]) => void,
    ): void;
    customHook: (data: any, callback: (data: any) => void) => void;
  }
}
