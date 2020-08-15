import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import SocketIOServer, { Server } from "socket.io";
import Redis from "ioredis";
import shortid from "shortid";
import SocketIORedisAdapter from "socket.io-redis";
import EventEmitter from "eventemitter3";
import { CreateServerOptions } from "../index.d";
import { configureServerEvents } from "./server-events";

export function createServer(
  httpServer: HttpServer | HttpsServer,
  config: CreateServerOptions
) {
  const server = SocketIOServer(httpServer, config.options);

  server.nodeId = shortid.generate();

  const socketEventsEmitter = new EventEmitter();

  server.nodes = {
    on: (...args) => socketEventsEmitter.on(...args),
    emit(event, socketId, data, ack) {
      if (ack === true) {
        return new Promise((resolve) => {
          emitTo(server, socketId, event, data, (response) => {
            resolve(response);
          });
        });
      }

      emitTo(server, socketId, event, data, ack);
    },
  };

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

  /**
   * Registry packets middleware to broadcast configured events
   */
  server.use((socket, next) => {
    socket.use((packet, next) => {
      const [event, data] = packet;

      if (config.broadcastedEvents.includes(event)) {
        server.events.emit("dispatchBroadcastedEvent", {
          socketId: socket.id,
          event,
          data,
        });
      }

      next();
    });
    next();
  });

  return server;
}

function emitTo(
  server: Server,
  id: string,
  event: string,
  data: any,
  callback?: (data: any) => void
) {
  if (id in server.sockets.connected) {
    return server.sockets.connected[id].emit(event, data, callback);
  }

  server.events.emit("dispatchSocketEvent", { id, event, data }, callback);
}
