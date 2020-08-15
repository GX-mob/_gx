import { Server } from "socket.io";
import EventEmitter from "eventemitter3";

export function configureServerEvents(
  server: Server,
  socketEvents: EventEmitter
) {
  const emitter = new EventEmitter();
  const { adapter } = server.of("/");

  server.events = emitter;

  adapter.customHook = (packet, cb) => {
    const [serverEvent, content] = packet;

    switch (serverEvent) {
      case "dispatchBroadcastedEvent":
        socketEvents.emit(content[0], content[1]);
        break;
      case "dispatchSocketEvent":
        const { id, event, data, ack } = content;
        if (!(id in server.sockets.connected)) {
          return cb(null);
        }

        if (ack) {
          server.sockets.connected[id].emit(event, data, (response: any) => {
            cb(response);
          });
          return;
        }

        server.sockets.connected[id].emit(event, data);

        cb(true);

        break;
    }

    cb(null);
  };

  emitter.on("dispatchBroadcastedEvent", (packet: any) => {
    adapter.customRequest(["dispatchBroadcastedEvent", packet]);
  });

  emitter.on(
    "dispatchSocketEvent",
    (contact: any, callback: (data: any) => void) => {
      adapter.customRequest(
        ["dispatchSocketEvent", contact],
        (err, replies) => {
          callback && callback(replies.find((value) => value));
        }
      );
    }
  );
}
