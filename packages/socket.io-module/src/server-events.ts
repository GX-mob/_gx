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
import { Server } from "socket.io";
import EventEmitter from "eventemitter3";

export function configureServerEvents(
  server: Server,
  socketEventsEmitter: EventEmitter,
  ackTimeout = 2000
) {
  const emitter = new EventEmitter();
  const { adapter } = server.of("/");

  server.events = emitter;

  adapter.customHook = (packet, cb) => {
    const [serverEvent, nodeId, content] = packet;

    if (nodeId === server.nodeId) {
      return cb(null);
    }

    switch (serverEvent) {
      case "dispatchBroadcastedEvent":
        socketEventsEmitter.emit(content.event, content);
        return cb(true);
      case "dispatchSocketEvent":
        const { id, event, data, ack } = content;
        if (!(id in server.sockets.connected)) {
          return cb(null);
        }

        if (!ack) {
          server.sockets.connected[id].emit(event, data);

          return cb(true);
        }

        const responseAckTimeout = setTimeout(() => {
          cb("ackTimeout");
        }, ackTimeout);

        server.sockets.connected[id].emit(event, data, (response: any) => {
          clearTimeout(responseAckTimeout);
          cb(response);
        });
        return;
    }

    cb(null);
  };

  emitter.on("dispatchBroadcastedEvent", (packet: any) => {
    adapter.customRequest(
      ["dispatchBroadcastedEvent", server.nodeId, packet],
      (err, replies) => {}
    );
  });

  emitter.on(
    "dispatchSocketEvent",
    (contact: any, callback: (data: any) => void) => {
      adapter.customRequest(
        ["dispatchSocketEvent", server.nodeId, contact],
        (err, replies) => {
          if (err) {
          }

          callback && callback(replies.find((value) => value));
        }
      );
    }
  );
}
