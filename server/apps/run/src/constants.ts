export enum NAMESPACES {
  VOYAGERS = "/voyagers",
  DRIVERS = "/drivers",
}

export enum CACHE_NAMESPACES {
  CONNECTIONS = "rides:connections",
}

export enum CACHE_TTL {
  CONNECTIONS = 1000 * 60 * 60 * 5, // 5 hours
}

export enum MATCH {
  MAX_EXECUTION = 60 * 5, // 60 = Executes the algorithm during 1 minute
  EXECUTION_INTERVAL = 1000, // 1 second
}

export enum OFFER {
  DRIVER_RESPONSE_TIMEOUT = 13000, // 13 seconds
  ADDITIONAL_METERS_OVER_TRY = 200,
  INITIAL_DISTANCE_LIMIT = 1000,
  DISTANCE_LIMIT = 1800,
}

export enum CANCELATION {
  SAFE_TIME_MS = 3, // 3 minutes
  FARE = 3,
}
