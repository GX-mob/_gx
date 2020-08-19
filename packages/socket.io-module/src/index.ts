/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
