import { ConnectionData, Events, State } from "./events";

declare module "socket.io" {
  interface Socket {
    state: State["state"];
    data: ConnectionData;
    emit<K extends keyof Events>(
      event: keyof Events,
      data: Events[K],
      callback?: any,
    ): boolean;
  }
}
