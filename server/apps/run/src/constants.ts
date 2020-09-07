export const CONNECTION_MODE = {
  VOYAGER: 1,
  DRIVER: 2,
};

export const PAYMETHOD = {
  MONEY: 1,
  CREDIT: 2,
};

export const CONNECTION_CACHE_NAMESPACE = "rides:connections";
export const CONNECTION_DATA_LIFETIME_MS = 1000 * 60 * 60 * 5; // 5 hours

export const MATCH_MAX_EXECUTION = 60 * 5; // 60 = Executes the algorithm during 1 minute
export const MATCH_EXECUTION_INTERVAL = 1000; // 1 second

export const OFFER_DRIVER_RESPONSE_TIMEOUT = 13000;
export const OFFER_ADDITIONAL_METERS_OVER_TRY = 200;
export const OFFER_INITIAL_DISTANCE_LIMIT = 1000;
export const OFFER_DISTANCE_LIMIT = 1800;

export const CANCELATION_SAFE_TIME_MS = 3; // 3 minutes
export const CANCELATION_FARE = 3;
