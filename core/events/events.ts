import { SchemaObject } from "types/schemapack";
import {
  IConfiguration,
  configurationSchema,
  //
  IDriverRideAcceptedResponse,
  driverRideAcceptedResponseSchema,
  //
  IVoyagerRideAcceptedResponse,
  voyagerRideAcceptedResponseSchema,
  //
  IOfferRequest,
  offerSchema,
  //
  IOfferResponse,
  offerReponseSchema,
  //
  IOfferSent,
  offerSentSchema,
  //
  IPositionData,
  positionSchema,
  //
  ISetup,
  driverSetupSchema,
  //
  IState,
  stateSchema,
  //
  ICancelRide,
  cancelRideSchema,
  //
  IDelayedOfferReponse,
  delayedOfferReponse,
  //
  IAmIRunning,
  amIRunningSchema,
  //
  IOfferGotTooLong,
  offerGotTooLong,
  //
  IGetOverHere,
  getOverHereSchema,
  //
  IStartRide,
  startRideSchema,
  //
  IFinishRide,
  finishRideSchema,
} from "./schemas";

export * from "./schemas";
export * from "./schemas/common";

export enum ERideFlowEvents {
  Configuration,
  DriverRideAcceptedResponse,
  VoyagerRideAcceptedResponse,
  Offer,
  OfferResponse,
  OfferSent,
  Position,
  DriverSetup,
  AccountState,
  AmIRunning,
  CancelRide,
  DelayedOfferResponse,
  OfferGotTooLong,
  GetOverHere,
  StartRide,
  FinishRide,
}

export const serverEventsSchemas: {
  [key in ERideFlowEvents]: {
    id: number;
    schema: SchemaObject<unknown>;
  };
} = {
  [ERideFlowEvents.Configuration]: {
    id: 1,
    schema: configurationSchema,
  },
  [ERideFlowEvents.DriverRideAcceptedResponse]: {
    id: 2,
    schema: driverRideAcceptedResponseSchema,
  },
  [ERideFlowEvents.VoyagerRideAcceptedResponse]: {
    id: 3,
    schema: voyagerRideAcceptedResponseSchema,
  },
  [ERideFlowEvents.Offer]: {
    id: 4,
    schema: offerSchema,
  },
  [ERideFlowEvents.OfferResponse]: {
    id: 5,
    schema: offerReponseSchema,
  },
  [ERideFlowEvents.OfferSent]: {
    id: 6,
    schema: offerSentSchema,
  },
  [ERideFlowEvents.Position]: {
    id: 7,
    schema: positionSchema,
  },
  [ERideFlowEvents.DriverSetup]: {
    id: 8,
    schema: driverSetupSchema,
  },
  [ERideFlowEvents.AccountState]: {
    id: 9,
    schema: stateSchema,
  },
  [ERideFlowEvents.AmIRunning]: {
    id: 10,
    schema: amIRunningSchema,
  },
  [ERideFlowEvents.CancelRide]: {
    id: 11,
    schema: cancelRideSchema,
  },
  [ERideFlowEvents.DelayedOfferResponse]: {
    id: 13,
    schema: delayedOfferReponse,
  },
  [ERideFlowEvents.OfferGotTooLong]: {
    id: 14,
    schema: offerGotTooLong,
  },
  [ERideFlowEvents.GetOverHere]: {
    id: 15,
    schema: getOverHereSchema,
  },
  [ERideFlowEvents.StartRide]: {
    id: 16,
    schema: startRideSchema,
  },
  [ERideFlowEvents.FinishRide]: {
    id: 17,
    schema: finishRideSchema,
  },
};

export interface IRideFlowEvents {
  [ERideFlowEvents.Configuration]: IConfiguration;
  [ERideFlowEvents.DriverRideAcceptedResponse]: IDriverRideAcceptedResponse;
  [ERideFlowEvents.VoyagerRideAcceptedResponse]: IVoyagerRideAcceptedResponse;
  [ERideFlowEvents.Offer]: IOfferRequest;
  [ERideFlowEvents.OfferResponse]: IOfferResponse;
  [ERideFlowEvents.OfferSent]: IOfferSent;
  [ERideFlowEvents.Position]: IPositionData;
  [ERideFlowEvents.DriverSetup]: ISetup;
  [ERideFlowEvents.AccountState]: IState;
  [ERideFlowEvents.AmIRunning]: IAmIRunning;
  [ERideFlowEvents.CancelRide]: ICancelRide;
  [ERideFlowEvents.DelayedOfferResponse]: IDelayedOfferReponse;
  [ERideFlowEvents.OfferGotTooLong]: IOfferGotTooLong;
  [ERideFlowEvents.GetOverHere]: IGetOverHere;
  [ERideFlowEvents.StartRide]: IStartRide;
  [ERideFlowEvents.FinishRide]: IFinishRide;
}
