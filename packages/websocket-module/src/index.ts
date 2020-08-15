import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import SocketIOServer, { Server as IOServier } from "socket.io";
import Redis from "ioredis";
import SocketIORedisAdapter from "socket.io-redis";
import EventEmitter from "eventemitter3";
import { CreateServerOptions } from "./types";
import { configureServerEvents } from "./server-events";

export function createServer(
  httpServer: HttpServer | HttpsServer,
  config: CreateServerOptions
) {
  const server = SocketIOServer(httpServer, config.options);

  const socketEventsEmitter = new EventEmitter();
  server.nodes = socketEventsEmitter;

  /**
   * Configure redis adapter
   */
  const adapter =
    typeof config.redis === "string"
      ? SocketIORedisAdapter({
          pubClient: new Redis(config.redis),
          subClient: new Redis(config.redis),
        })
      : SocketIORedisAdapter(config.redis);

  server.adapter(adapter);

  configureServerEvents(server, socketEventsEmitter);

  server.emitTo = function emitTo(
    id: string,
    event: string,
    data: any,
    callback?: (data: any) => void
  ) {
    if (id in server.sockets.connected) {
      return server.sockets.connected[id].emit(event, data);
    }

    server.events.emit("dispatchSocketEvent", { id, event, data }, callback);
  };

  /**
   * Registry packets middleware to broadcast configured events
   */
  server.use((socket, next) => {
    socket.use((packet, next) => {
      const [event] = packet;

      if (config.broadcastedEvents.includes(event)) {
        server.events.emit("dispatchBroadcastedEvent", packet);
      }

      next();
    });
    next();
  });

  return server;
}
