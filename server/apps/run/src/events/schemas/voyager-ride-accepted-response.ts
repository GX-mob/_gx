export type VoyagerRideAcceptedResponse = {
  ridePID: string;
  driverPID: string;
  timestamp: number;
};

export const voyagerRideAcceptedResponseSchema = {
  ridePID: "string",
  driverPID: "string",
  timestamp: "uint32",
};
