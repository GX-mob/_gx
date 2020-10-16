import { CONSTANTS as STORAGE_CONSTANTS } from "@app/storage";

export const CACHE_NAMESPACES = {
  REGISTRY_VERIFICATIONS: "registryVerifications",
  SIGNIN_VERIFICATIONS: "signInVerifications",
  RIDE_READ_PERMISSIONS: "rideReadPermission",
};

export const CACHE_TTL = {
  CONTACT_VERIFICATION: 1000 * 60,
};

export const STORAGE_BUCKETS = {
  USERS_AVATARTS: "gx-mob-users-avatars",
};

export const STORAGE_PREFIX_URLS = {
  USERS_AVATARTS: STORAGE_CONSTANTS.DEFAULT_URL_PREFIX,
};

// thanks branas
export const BUSINESS_TIME_HOURS = { START: 9, END: 18 };

// Facilitates payment ignoring cents of second decimal place
export const AMOUT_DECIMAL_ADJUST = -1;

export const LONG_RIDE = {
  DISTANCE_KM: 10.0,
  MINUTES: 40,
};
