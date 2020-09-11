export enum NAMESPACES {
  VOYAGERS = "/voyagers",
  DRIVERS = "/drivers",
}

export enum CACHE_NAMESPACES {
  CONNECTIONS = "ridesConnections",
  OFFERS = "ridesOffers",
}

export enum CACHE_TTL {
  CONNECTIONS = 1000 * 60 * 60 * 5, // 5 hours
  OFFERS = 1000 * 60 * 15, // 15 minutes
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

export enum EXCEPTIONS {
  CONNECTION_DATA_NOT_FOUND = "CONNECTION_DATA_NOT_FOUND",
  RIDE_NOT_FOUND = "RIDE_NOT_FOUND",
}
