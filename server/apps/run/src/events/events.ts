import {
  configurationSchema,
  driverRideAcceptedResponseSchema,
  voyagerRideAcceptedResponseSchema,
  offerSchema,
  offerReponseSchema,
  offerSentSchema,
  positionSchema,
  driverSetupSchema,
  stateSchema,
  cancelRideSchema,
  canceledRideSchema,
} from "./schemas";

export * from "./schemas";
export * from "./schemas/common";

export enum EVENTS {
  CONFIGURATION = "CONFIGURATION",
  DRIVER_RIDE_ACCEPTED_RESPONSE = "DRIVER_RIDE_ACCEPTED_RESPONSE",
  VOYAGER_RIDE_ACCEPTED_RESPONSE = "VOYAGER_RIDE_ACCEPTED_RESPONSE",
  OFFER = "OFFER",
  OFFER_RESPONSE = "OFFER_RESPONSE",
  OFFER_SENT = "OFFER_SENT",
  POSITION = "POSITION",
  DRIVER_SETUP = "DRIVER_SETUP",
  STATE = "STATE",
  AM_I_RUNNING = "AM_I_RUNNING",
  CANCEL_RIDE = "CANCEL_RIDE",
  CANCELED_RIDE = "CANCELED_RIDE",
}

export const serverEventsSchemas = {
  [EVENTS.CONFIGURATION]: {
    id: 1,
    schema: configurationSchema,
  },
  [EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE]: {
    id: 2,
    schema: driverRideAcceptedResponseSchema,
  },
  [EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE]: {
    id: 3,
    schema: voyagerRideAcceptedResponseSchema,
  },
  [EVENTS.OFFER]: {
    id: 4,
    schema: offerSchema,
  },
  [EVENTS.OFFER_RESPONSE]: {
    id: 5,
    schema: offerReponseSchema,
  },
  [EVENTS.OFFER_SENT]: {
    id: 6,
    schema: offerSentSchema,
  },
  [EVENTS.POSITION]: {
    id: 7,
    schema: positionSchema,
  },
  [EVENTS.DRIVER_SETUP]: {
    id: 8,
    schema: driverSetupSchema,
  },
  [EVENTS.STATE]: {
    id: 9,
    schema: stateSchema,
  },
  [EVENTS.AM_I_RUNNING]: {
    id: 10,
    schema: "uint8",
  },
  [EVENTS.CANCEL_RIDE]: {
    id: 11,
    schema: cancelRideSchema,
  },
  [EVENTS.CANCELED_RIDE]: {
    id: 12,
    schema: canceledRideSchema,
  },
};
