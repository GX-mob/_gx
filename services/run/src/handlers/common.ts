import { Server, Socket } from "socket.io";
import { Inject } from "fastify-decorators";
import { DataService, CacheService, Models, util } from "@gx-mob/http-service";
import { Position, State } from "../schemas/events";
import { EventEmitter } from "eventemitter3";
import Node from "../node";
import {
  CANCELATION_SAFE_TIME_MS,
  PRICE_OF_CANCELATION_OUT_OF_SAFE_TIME,
} from "../constants";

type CancelResponse = Promise<{
  status: string;
  pendencie?: Models.Pendencie;
  error?: string;
}>;

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
    socket.on("cancelRide", async (pid, ack) => {
      try {
        const result = await this.cancelRide(pid);
        ack(result);
      } catch (error) {
        this.node.instance.log.error(error);
        ack({ status: "error", error: "internal-error" });
      }
    });

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

  async cancelRide(pid: string) {
    const now = Date.now();
    const ride = await this.data.rides.get({ pid });

    /**
     * Security checks
     */
    if (!ride) {
      return { status: "error", error: "ride-not-found" };
    }

    const { _id } = this.socket.connection;

    if (ride.voyager !== _id || ride.driver !== _id) {
      return { status: "error", error: "not-allowed" };
    }

    const offer = await this.io.state.offers.get(pid);
    const { requesterSocketId, driverSocketId, acceptTimestamp } = offer;

    /**
     * Safe cancel, no pendencie needed
     */
    if (acceptTimestamp + CANCELATION_SAFE_TIME_MS > now) {
      await this.safeCancel(pid);
      const alertSocket =
        this.socket.connection.mode === 1 ? driverSocketId : requesterSocketId;

      this.io.nodes.emit("rideCancellation", alertSocket, { pid });

      return { status: "ok" };
    }

    /**
     * Creates a pendencie or charge the cancel fee
     */
    switch (this.socket.connection.mode) {
      case 1:
        return this.handleVoyagerNoSafeCancel(ride, offer);
      case 2:
        return this.handleDriverNoSafeCancel(ride, offer);
      default:
        return { status: "error", error: "undefined-usage" };
    }
  }

  private async safeCancel(pid: string) {
    /**
     * Handle voyager safe cancellation
     */
    if (this.socket.connection.mode === 1) {
      return this.data.rides.update({ pid }, { status: "canceled" });
    }

    /**
     * Handle driver safe cancellation
     */
    return this.data.rides.update({ pid }, { driver: null });
  }

  private async handleVoyagerNoSafeCancel(
    ride: Models.Ride,
    offer: any
  ): CancelResponse {
    /**
     * Creates a pendencie if the payment method is money
     */
    if (ride.payMethod === 1) {
      const pendencie = await this.createPendencie(ride);

      /**
       * Emit to driver the cancellation event and the generated pendencie
       */
      this.io.nodes.emit(offer.driverSocketId, "canceledRide", {
        pid: ride.pid,
        pendencie,
      });

      /**
       * Acknowledgment to voyager
       */
      return { status: "ok", pendencie };
    }

    // stripe api, request payment
    return { status: "ok" };
  }
  private async handleDriverNoSafeCancel(
    ride: Models.Ride,
    offer: any
  ): CancelResponse {
    const pendencie = await this.createPendencie(ride);

    /**
     * Emit to voyager the cancellation event and the generated pendencie
     */
    this.io.nodes.emit(offer.requesterSocketId, "canceledRide", {
      pid: ride.pid,
      pendencie,
    });

    /**
     * Acknowledgment to driver
     */
    return { status: "ok", pendencie };
  }

  private createPendencie(ride: Models.Ride) {
    const affected =
      this.socket.connection.mode === 1 ? ride.driver : ride.voyager;

    return util.retry(() =>
      this.data.pendencies.create({
        issuer: this.socket.connection._id,
        affected,
        amount: PRICE_OF_CANCELATION_OUT_OF_SAFE_TIME,
        ride: ride._id,
      })
    );
  }
}
