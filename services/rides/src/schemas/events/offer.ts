import location, { Location } from "../common/location";
import rideTypes, { RideTypes } from "../common/ride-types";

/**
 * Position event schema
 */
export type Offer = {
  id: string;
  voyagerPID: string;
  /**
   * Start point of the ride
   */
  start: Location;
  waypoint: Location[] | [];
  /**
   * End point of the ride
   */
  end: Location;
  /**
   * Ride types
   * * 1 = Normal
   * * 2 = VIG - Very important gx
   */
  type: RideTypes;
  /**
   * Distance in meters
   */
  distance: number;
  /**
   * Paymethod
   * * 1 = Money
   * * 2 = Credit card
   */
  payMethod: 1 | 2;
  /**
   * Ride calculated price
   */
  amount: number;
};

export type ServerProps = {
  /**
   * To improve performance of the riders iteration.
   *
   * Riders that are too away or aren't eligible are added
   * to this list and jumped in the next iteration
   */
  ignoreds: string[];
  /**
   * Riders that recused the ride
   */
  recused: string[];
  /**
   * Used to prevent the re-send an accepted ride
   */
  accepted: boolean;
  /**
   * Route path sent to rider
   */
  routeSent: boolean;
  /**
   * Timeout to rider response the offer
   */
  offerResponseTimeout?: NodeJS.Timeout;
  /**
   * Send buffer, encoded offer object
   * Perfomance improvement, to don't encode the object in each event emission
   */
  sendBuff: Buffer;

  /**
   * Used to increase the distance ratio of match algorithm
   */
  trys: number;
};

export type OfferServer = Offer & ServerProps;

const offer = {
  id: "string",
  start: location,
  waypoints: [location],
  end: location,
  type: rideTypes,
  distance: "uint16",
  payMethod: "uint8",
  amount: "uint16",
};

export const offerServer = {
  ...offer,
  ignoreds: ["string"],
  recused: ["string"],
  accepted: "boolean",
  routeSent: "boolean",
};

export default {
  id: 1,
  schema: offer,
};
