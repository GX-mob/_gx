import { Schema } from "@colyseus/schema";
import { SchemaObject } from "../types/schemapack";
import {
  IConfiguration,
  ConfigurationSchema,
  //
  IDriverRideAcceptedResponse,
  DriverRideAcceptedResponseSchema,
  //
  IVoyagerRideAcceptedResponse,
  VoyagerRideAcceptedResponseSchema,
  //
  IOfferRequest,
  OfferSchema,
  //
  IOfferResponse,
  OfferResponseSchema,
  //
  IOfferSent,
  OfferSent,
  //
  IPositionData,
  PositionSchema,
  //
  ISetup,
  DriverSetupSchema,
  //
  //
  ICancelRide,
  CancelRideSchema,
  //
  IDelayedOfferReponse,
  DelayedOfferReponse,
  //
  IAmIRunning,
  AmIRunningSchema,
  //
  IOfferGotTooLong,
  OfferGotTooLongSchema,
  //
  IGetOverHere,
  GetOverHereSchema,
  //
  IStartRide,
  StartRideSchema,
  //
  IFinishRide,
  FinishRideSchema,
} from "./interfaces";

export * from "./interfaces";
export * from "./interfaces/common";

export enum ERideFlowEvents {
  Configuration = "Configuration",
  DriverRideAcceptedResponse = "DriverRideAcceptedResponse",
  VoyagerRideAcceptedResponse = "VoyagerRideAcceptedResponse",
  Offer = "Offer",
  OfferResponse = "OfferResponse",
  OfferSent = "OfferSent",
  Position = "Position",
  DriverSetup = "DriverSetup",
  AmIRunning = "AmIRunning",
  CancelRide = "CancelRide",
  DelayedOfferResponse = "DelayedOfferResponse",
  OfferGotTooLong = "OfferGotTooLong",
  GetOverHere = "GetOverHere",
  StartRide = "StartRide",
  FinishRide = "FinishRide",
}

export const serverEventsSchemas: {
  [key in ERideFlowEvents]: {
    id: number;
    schema: typeof Schema;
  };
} = {
  [ERideFlowEvents.Configuration]: {
    id: 1,
    schema: ConfigurationSchema,
  },
  [ERideFlowEvents.DriverRideAcceptedResponse]: {
    id: 2,
    schema: DriverRideAcceptedResponseSchema,
  },
  [ERideFlowEvents.VoyagerRideAcceptedResponse]: {
    id: 3,
    schema: VoyagerRideAcceptedResponseSchema,
  },
  [ERideFlowEvents.Offer]: {
    id: 4,
    schema: OfferSchema,
  },
  [ERideFlowEvents.OfferResponse]: {
    id: 5,
    schema: OfferResponseSchema,
  },
  [ERideFlowEvents.OfferSent]: {
    id: 6,
    schema: OfferSent,
  },
  [ERideFlowEvents.Position]: {
    id: 7,
    schema: PositionSchema,
  },
  [ERideFlowEvents.DriverSetup]: {
    id: 8,
    schema: DriverSetupSchema,
  },
  [ERideFlowEvents.AmIRunning]: {
    id: 10,
    schema: AmIRunningSchema,
  },
  [ERideFlowEvents.CancelRide]: {
    id: 11,
    schema: CancelRideSchema,
  },
  [ERideFlowEvents.DelayedOfferResponse]: {
    id: 13,
    schema: DelayedOfferReponse,
  },
  [ERideFlowEvents.OfferGotTooLong]: {
    id: 14,
    schema: OfferGotTooLongSchema,
  },
  [ERideFlowEvents.GetOverHere]: {
    id: 15,
    schema: GetOverHereSchema,
  },
  [ERideFlowEvents.StartRide]: {
    id: 16,
    schema: StartRideSchema,
  },
  [ERideFlowEvents.FinishRide]: {
    id: 17,
    schema: FinishRideSchema,
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
  [ERideFlowEvents.AmIRunning]: IAmIRunning;
  [ERideFlowEvents.CancelRide]: ICancelRide;
  [ERideFlowEvents.DelayedOfferResponse]: IDelayedOfferReponse;
  [ERideFlowEvents.OfferGotTooLong]: IOfferGotTooLong;
  [ERideFlowEvents.GetOverHere]: IGetOverHere;
  [ERideFlowEvents.StartRide]: IStartRide;
  [ERideFlowEvents.FinishRide]: IFinishRide;
}
