import { Server, Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService, CacheService } from "@gx-mob/http-service";
import { Position, State } from "../schemas/events";
import { EventEmitter } from "eventemitter3";
import { User } from "@gx-mob/http-service/dist/models";
import Node from "../";

export class Common extends EventEmitter {
  @Inject(DataService)
  public data!: DataService;

  @Inject(DataService)
  public cache!: CacheService;

  public connectionState: State["state"] = 1;

  constructor(public node: Node, public io: Server, public socket: Socket) {
    super();

    const { pid } = socket.connection;

    socket.on("position", (data) => this.positionEvent(data));
    socket.on("state", (data) => this.stateEvent(data));

    socket.on("disconnect", () => {
      this.dispachToObervers<State>(
        "state",
        {
          pid,
          state: 0,
        },
        false
      );
    });
  }

  positionEvent(position: Position) {
    this.emit("position", position);
    this.dispachToObervers("position", this.signObservableEvent(position));
  }

  stateEvent(state: State) {
    this.connectionState = state.state;

    this.emit("state", state);
    this.dispachToObervers("state", this.signObservableEvent(state));
  }

  dispachToObervers<T = any>(event: string, data: T, considerP2P = true) {
    const { observers } = this.socket.connection;
    for (let i = 0; i < observers.length; ++i) {
      if (considerP2P && observers[i].p2p) {
        continue;
      }
      this.io.nodes.emit(event, observers[i].socketId, data);
    }
  }

  signObservableEvent<T = any>(packet: T): T {
    return { ...packet, pid: this.socket.connection.pid };
  }
}
