export type Type = {
  ridePID: string;
  driverPID: string;
  timestamp: number;
};

export const schema = {
  ridePID: "string",
  driverPID: "string",
  timestamp: "uint32",
};

export default {
  id: 0,
  schema,
};
