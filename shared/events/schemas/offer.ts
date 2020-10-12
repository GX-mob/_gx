import { SchemaObject } from "../../types/schemapack";
import { PickingUpPath } from "./picking-up-path";

export type OfferRequest = {
  /**
   * The public ID of created ride.
   */
  ridePID: string;
};

export type OfferServer = {
  /**
   * Ride public id
   */
  ridePID: string;
  /**
   * Usefull requester data
   */
  requesterSocketId: string;
  /**
   * To improve performance of the riders iteration.
   *
   * Drivers that are too distante, not eligible, that hit the
   * response timeout or refuse the offer are added to this list
   * and skipped in the next iteration.
   */
  ignoreds: string[];
  /**
   * Timeout to rider response the offer
   */
  offerResponseTimeout: NodeJS.Timeout | null;
  /**
   * Send buffer, encoded offer object
   *
   * Perfomance improvement, to don't encode the object in each event emission
   */
  /**
   * Offered
   *
   * Current offered driver
   */
  offeredTo: string | null;
  /**
   * Socket id of the driver thats accepts the ride
   */
  driverSocketId?: string;
  /**
   * Accepted timestamp, used to define a safe cancelation without fares
   */
  acceptTimestamp?: number;
  pickingUpPath?: PickingUpPath;
};

export const offerSchema: SchemaObject<OfferRequest> = {
  ridePID: "string",
};
