import { Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService } from "@gx-mob/http-service";
import { PositionEvent } from "../schemas/events";

export class Common {
  @Inject(DataService)
  public data!: DataService;

  constructor(public socket: Socket) {
    socket.on("position", (data) => this.position(data));
  }

  position(position: PositionEvent) {
    console.log(position);
  }
}
