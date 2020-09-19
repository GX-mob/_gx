import {
  Configuration,
  configurationSchema,
  //
  DriverRideAcceptedResponse,
  driverRideAcceptedResponseSchema,
  //
  VoyagerRideAcceptedResponse,
  voyagerRideAcceptedResponseSchema,
  //
  OfferRequest,
  offerSchema,
  //
  OfferResponse,
  offerReponseSchema,
  //
  OfferSent,
  offerSentSchema,
  //
  Position,
  positionSchema,
  //
  Setup,
  driverSetupSchema,
  //
  State,
  stateSchema,
  //
  CancelRide,
  cancelRideSchema,
  //
  CanceledRide,
  canceledRideSchema,
  //
  DelayedOfferReponse,
  delayedOfferReponse,
  //
  AmIRunning,
  amIRunningSchema,
  //
  OfferGotTooLong,
  offerGotTooLong,
  //
  PickingUpPath,
  pickingUpPathSchema,
  //
  StartRide,
  startRideSchema,
  //
  FinishRide,
  finishRideSchema,
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
  DELAYED_OFFER_RESPONSE = "DELAYED_OFFER_RESPONSE",
  OFFER_GOT_TOO_LONG = "OFFER_GOT_TOO_LONG",
  PICKING_UP_PATH = "PICKING_UP_PATH",
  START_RIDE = "START_RIDE",
  FINISH_RIDE = "FINISH_RIDE",
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
    schema: amIRunningSchema,
  },
  [EVENTS.CANCEL_RIDE]: {
    id: 11,
    schema: cancelRideSchema,
  },
  [EVENTS.CANCELED_RIDE]: {
    id: 12,
    schema: canceledRideSchema,
  },
  [EVENTS.DELAYED_OFFER_RESPONSE]: {
    id: 13,
    schema: delayedOfferReponse,
  },
  [EVENTS.OFFER_GOT_TOO_LONG]: {
    id: 14,
    schema: offerGotTooLong,
  },
  [EVENTS.PICKING_UP_PATH]: {
    id: 15,
    schema: pickingUpPathSchema,
  },
  [EVENTS.START_RIDE]: {
    id: 16,
    schema: startRideSchema,
  },
  [EVENTS.FINISH_RIDE]: {
    id: 17,
    schema: finishRideSchema,
  },
};

export interface EventsInterface {
  [EVENTS.CONFIGURATION]: Configuration;
  [EVENTS.DRIVER_RIDE_ACCEPTED_RESPONSE]: DriverRideAcceptedResponse;
  [EVENTS.VOYAGER_RIDE_ACCEPTED_RESPONSE]: VoyagerRideAcceptedResponse;
  [EVENTS.OFFER]: OfferRequest;
  [EVENTS.OFFER_RESPONSE]: OfferResponse;
  [EVENTS.OFFER_SENT]: OfferSent;
  [EVENTS.POSITION]: Position;
  [EVENTS.DRIVER_SETUP]: Setup;
  [EVENTS.STATE]: State;
  [EVENTS.AM_I_RUNNING]: AmIRunning;
  [EVENTS.CANCEL_RIDE]: CancelRide;
  [EVENTS.CANCELED_RIDE]: CanceledRide;
  [EVENTS.DELAYED_OFFER_RESPONSE]: DelayedOfferReponse;
  [EVENTS.OFFER_GOT_TOO_LONG]: OfferGotTooLong;
  [EVENTS.PICKING_UP_PATH]: PickingUpPath;
  [EVENTS.START_RIDE]: StartRide;
  [EVENTS.FINISH_RIDE]: FinishRide;
}
