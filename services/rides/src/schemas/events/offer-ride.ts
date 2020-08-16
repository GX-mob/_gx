import location, { Location } from "../common/location";
import rideTypes, { RideTypes } from "../common/ride-types";

/**
 * Position event schema
 */
export type OfferRide = {
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

export default {
  id: 1,
  schema: {
    start: location,
    waypoints: [location],
    end: location,
    type: rideTypes,
    distance: "uint16",
    payMethod: "uint8",
    amount: "uint16",
  },
};
