import ms from "ms";
import { ERideFlowEvents } from "@core/ride-flow/events";

export enum GatewayNamespaces {
  Voyagers = "/voyagers",
  Drivers = "/drivers",
}

export enum CacheNamespaces {
  CONNECTIONS = "ridesConnections",
  OFFERS = "ridesOffers",
}

export enum CacheTTL {
  CONNECTIONS = 1000 * 60 * 60 * 2, // 2 hours
  OFFERS = 1000 * 60 * 60, // 1 hour
}

export enum CancelationExceptionsCodes {
  RideRunning = "ride-running",
}

export enum CommonExceptionsCodes {
  ConnectionDataNotFound = "conn-data-404",
  RideNotFound = "ride-404",
  OfferNotFound = "offer-404",
  VehicleNotFound = "vehicle-404",
  UncancelableRide = "uncancelable-ride",
  NotInRide = "not-in-ride",
  TooDistantOfExpected = "too-distant",
}

export const ClientBroadcastedEvents = {
  [GatewayNamespaces.Drivers]: [
    ERideFlowEvents.Position,
    ERideFlowEvents.DriverSetup,
    ERideFlowEvents.OfferResponse,
    ERideFlowEvents.Configuration,
  ],
};

export const DISTANCE_TOLERANCE_TO_FINISH_RIDE = 50; // in meters
export const DISTANCE_TOLERANCE_TO_START_RIDE = 20; // in meters

export const DRIVER_OBJECT_LIST_CLEANUP_INTERVAL = ms("5 minutes");
export const DRIVER_OBJECT_LIFETIME = ms("5 minutes");
