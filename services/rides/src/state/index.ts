//import { Server } from "socket.io";
export { Riders } from "./riders";
export { Offers } from "./offers";

/*
export class State {
  public Riders = new Riders(this.io);
  public Offers = new Offers(this.io);
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
    
  }
}
*/
