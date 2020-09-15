import { ConnectionData, EventsInterface, State } from "./events";

declare module "socket.io" {
  interface Socket {
    state: State["state"];
    data: ConnectionData;
    emit<K extends keyof EventsInterface>(
      event: keyof EventsInterface,
      data: EventsInterface[K],
      callback?: any,
    ): boolean;
  }
}
