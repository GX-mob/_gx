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

export enum MATCH {
  MAX_EXECUTION = 60 * 5, // 60 = Executes the algorithm during 1 minute
  ITERATION_INTERVAL = 1000, // 1 second
}

export enum OFFER {
  CREATE_RESPONSE_RIDE_NOT_FOUND = "ride-not-found",
  CREATE_RESPONSE_OFFERING = "offering",

  DRIVER_RESPONSE_TIMEOUT = 13000, // 13 seconds
  INITIAL_RADIUS_SIZE = 1000,
  ADD_RADIUS_SIZE_EACH_ITERATION = 200,
  MAX_RADIUS_SIZE = 1800,
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
