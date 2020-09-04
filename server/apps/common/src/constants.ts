import { CONSTANTS as STORAGE_CONSTANTS } from "@app/storage";

export const EXCEPTIONS_MESSAGES = {
  USER_NOT_FOUND: "user-not-found",
  WRONG_PASSWORD: "wrong-password",
  WRONG_CODE: "wrong-code",
  PHONE_REGISTRED: "phone-already-registred",
  TERMS_NOT_ACCEPTED: "terms-not-accepted",
  VERIFICATION_NOT_FOUND: "verification-not-found",
  PHONE_NOT_VERIFIED: "phone-not-verified",
  INVALID_CPF: "invalid-cpf",
  CPF_REGISTRED: "cpf-already-registred",
  REMOVE_CONTACT_NOT_ALLOWED: "remove-contact-not-allowed",
  PASSWORD_REQUIRED: "password-required",
  UNCHANGED_DATA: "unchanged-data",
  CONTACT_ALREADY_REGISTRED: "contact-already-registred",
  NOT_OWN_CONTACT: "not-own-contact",
};

export const CACHE_NAMESPACES = {
  REGISTRY_VERIFICATIONS: "registryVerifications",
};

export const STORAGE_BUCKETS = {
  USERS_AVATARTS: "gx-mob-users-avatars",
};

export const STORAGE_PREFIX_URLS = {
  USERS_AVATARTS: STORAGE_CONSTANTS.DEFAULT_URL_PREFIX,
};
