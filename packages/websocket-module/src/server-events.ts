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
