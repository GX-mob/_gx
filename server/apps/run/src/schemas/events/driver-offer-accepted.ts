import EVENTS_MAP from "../events-map";

export type DriverOfferAccepted = {
  ridePID: string;
  timestamp: number;
};

export const driverOfferAcceptedSchema = {
  ridePID: "string",
  timestamp: "uint32",
};

export default {
  id: EVENTS_MAP.DRIVER_OFFER_ACCEPTED.ID,
  schema: driverOfferAcceptedSchema,
};
