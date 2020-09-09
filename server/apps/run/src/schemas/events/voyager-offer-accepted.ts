import EVENTS_MAP from "../events-map";

export type VoyagerOfferAccepted = {
  ridePID: string;
  driverPID: string;
  timestamp: number;
};

export const voyagerOfferAcceptedSchema = {
  ridePID: "string",
  driverPID: "string",
  timestamp: "uint32",
};

export default {
  id: EVENTS_MAP.VOYAGER_OFFER_ACCEPTED.ID,
  schema: voyagerOfferAcceptedSchema,
};
