export type Type = {
  offerID: string;
  driverPID: string;
};

export const schema = {
  offerID: "string",
  driverPID: "string",
  driverAcceptedTimestamp: "uint32",
};

export default {
  id: 0,
  schema,
};
