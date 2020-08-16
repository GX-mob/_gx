import { Server, Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService } from "@gx-mob/http-service";
import { Position, StateEvent } from "../schemas/events";
import { EventEmitter } from "eventemitter3";
import { User } from "@gx-mob/http-service/dist/models";

export class Common extends EventEmitter {
  @Inject(DataService)
  public data!: DataService;

  /**
   * User
   */
  public user: User;
  public state: number = 1;
  public position: Position | undefined;

  constructor(public io: Server, public socket: Socket) {
    super();

    this.user = socket.session.user;

    socket.on("position", (data) => this.positionEvent(data));
    socket.on("state", (data) => this.stateEvent(data));
  }

  positionEvent(position: Position) {
    this.position = position;

    this.emit("position", position);
    this.dispachToObervers("position", { ...position, id: this.socket.id });
  }

  stateEvent(state: StateEvent) {
    this.state = state.state;

    this.emit("state", state);
    this.dispachToObervers("state", state);
  }

  dispachToObervers(event: string, data: any) {
    this.socket.observers.forEach((id) => {
      this.io.nodes.emit(event, id, data);
    });
  }
}
