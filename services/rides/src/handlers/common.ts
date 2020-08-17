import { Server, Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService, CacheService } from "@gx-mob/http-service";
import { Position, State } from "../schemas/events";
import { UserBasic } from "../schemas/common/user-basic";
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
  public connectionState: State["state"] = 1;
  public position: Position | undefined;
  public rideState: UserBasic["state"] = 1;

  constructor(public io: Server, public socket: Socket) {
    super();

    this.self = socket.session.user;

    socket.on("position", (data) => this.positionEvent(data));
    socket.on("state", (data) => this.stateEvent(data));

    socket.on("disconnect", () => {
      this.dispachToObervers<State>(
        "state",
        {
          state: 0,
          pid: this.self.pid as string,
        },
        false
      );
    });

    this.warmup();
  }

  async warmup() {
    const state = await this.cache.get("rides:userState", this.self.pid);
    this.rideState = state;
  }

  positionEvent(position: Position) {
    this.position = position;

    this.emit("position", position);
    this.dispachToObervers("position", this.signObservableEvent(position));
  }

  stateEvent(state: State) {
    this.connectionState = state.state;

    this.emit("state", state);
    this.dispachToObervers("state", this.signObservableEvent(state));
  }

  dispachToObervers<T = any>(event: string, data: T, considerP2P = true) {
    const { observers } = this.socket;
    for (let i = 0; i < observers.length; ++i) {
      if (considerP2P && observers[i].p2p) {
        continue;
      }
      this.io.nodes.emit(event, observers[i].socketId, data);
    }
  }

  signObservableEvent<T = any>(packet: T): T {
    return { ...packet, pid: this.self.pid };
  }
}
