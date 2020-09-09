export type DriverRideAcceptedResponse = {
  ridePID: string;
  timestamp: number;
};

export const driverRideAcceptedResponseSchema = {
  ridePID: "string",
  timestamp: "uint32",
};
