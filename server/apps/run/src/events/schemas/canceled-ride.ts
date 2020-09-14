export type CanceledRide = {
  ridePID: string;
  status: "safe" | "pendencie-issued";
};
export const canceledRideSchema = { ridePID: "string", status: "string" };
