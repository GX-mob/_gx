import { Server, Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService, CacheService } from "@gx-mob/http-service";
import { Position, State } from "../schemas/events";
import { EventEmitter } from "eventemitter3";
import { User } from "@gx-mob/http-service/dist/models";

export class Common extends EventEmitter {
  @Inject(DataService)
  public data!: DataService;

  @Inject(DataService)
  public cache!: CacheService;

  /**
   * User
   */
  public self: User;
  public state: State["state"] = 1;
  public position: Position | undefined;

  constructor(public io: Server, public socket: Socket) {
    super();

    this.self = socket.session.user;

    this.cache.set("rides:connections", this.self.pid, {
      socketId: socket.id,
    });

    socket.on("position", (data) => this.positionEvent(data));
    socket.on("state", (data) => this.stateEvent(data));

    socket.on("disconnect", () => {});
  }

  positionEvent(position: Position) {
    this.position = position;

    this.emit("position", position);
    this.dispachToObervers("position", this.signObservableEvent(position));
  }

  stateEvent(state: State) {
    this.state = state.state;

    this.emit("state", state);
    this.dispachToObervers("state", this.signObservableEvent(state));
  }

  dispachToObervers<T = any>(event: string, data: T) {
    const { observers } = this.socket;
    for (let i = 0; i < observers.length; ++i) {
      this.io.nodes.emit(event, observers[i], data);
    }
  }

  signObservableEvent<T = any>(packet: T): T {
    return { ...packet, id: this.self.pid };
  }
}
