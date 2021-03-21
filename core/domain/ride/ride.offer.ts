import { IRideAreaConfiguration } from "../ride-areas/ride-areas.types";
import { IRide, IRideOffer } from "./ride.types";

export class RideOffer {
  public runTimes: number = 0;

  constructor(
    private readonly ride: IRide,
    private areaConfig: IRideAreaConfiguration,
  ) {}

  public getOfferDistance() {
    const {
      initialRadiusSize,
      additionalRadiusSizeByEachIteration,
      maxRadiusSize,
    } = this.areaConfig.offerConfig;

    const distance =
      this.runTimes === 1
        ? initialRadiusSize
        : initialRadiusSize +
          additionalRadiusSizeByEachIteration * this.runTimes;

    return distance > maxRadiusSize ? maxRadiusSize : distance;
  }

  public toJSON(): IRideOffer {
    return {
      pid: this.ride.pid,
    };
  }
}
