import { Server } from "socket.io";
import { Riders } from "./riders";
import { Invites } from "./invites";
import { Rides } from "./rides";

export class State {
  public Riders = new Riders(this.io);
  public Invites = new Invites(this.io);
  public Rides = new Rides(this.io);

  constructor(public io: Server) {
    this.warmup();
  }

  private warmup() {
    /*
    this.io.nodes.server.emit("warmupme", ({ riders, invites, rides }) => {
      this.Riders.warmup(riders);
      this.Invites.warmup(invites);
      this.Riders.warmup(rides);
    })
    */
  }
}
