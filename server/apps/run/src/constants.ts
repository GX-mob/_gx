import { EVENTS } from "./events";

export enum NAMESPACES {
  VOYAGERS = "/voyagers",
  DRIVERS = "/drivers",
}

export enum CACHE_NAMESPACES {
  CONNECTIONS = "ridesConnections",
  OFFERS = "ridesOffers",
}

export enum CACHE_TTL {
  CONNECTIONS = 1000 * 60 * 60 * 2, // 2 hours
  OFFERS = 1000 * 60 * 60, // 1 hour
}

export enum CANCELATION {
  SAFE_TIME_MS = 1000 * 60 * 3, // 3 minutes
  FARE = 3,
}

export enum CANCELATION_EXCEPTIONS {
  RIDE_NOT_FOUND = "ride-not-found",
  RIDE_RUNNING = "ride-running",
  NOT_IN_RIDE = "not-in-ride",
}

export enum CANCELATION_REPONSE {
  SAFE,
  PENDENCIE_ISSUED,
}

export enum EXCEPTIONS {
  CONNECTION_DATA_NOT_FOUND = "CONNECTION_DATA_NOT_FOUND",
  RIDE_NOT_FOUND = "RIDE_NOT_FOUND",
  UNCANCELABLE_RIDE = "UNCANCELABLE_RIDE",
  NOT_IN_RIDE = "NOT_IN_RIDE",
  TOO_DISTANT_OF_EXPECTED = "TOO_DISTANT_OF_EXPECTED",
}

export const BROADCASTED_EVENTS = {
  [NAMESPACES.DRIVERS]: [
    EVENTS.POSITION,
    EVENTS.DRIVER_SETUP,
    EVENTS.OFFER_RESPONSE,
    EVENTS.CONFIGURATION,
  ],
};

export const DISTANCE_TOLERANCE_TO_FINISH_RIDE = 50; // in meters
export const DISTANCE_TOLERANCE_TO_START_RIDE = 20; // in meters
