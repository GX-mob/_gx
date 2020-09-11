import { registerAs } from "@nestjs/config";

export const MATCH = registerAs("MATCH", () => ({
  MAX_ITERATION: 60,
  ITERATION_INTERVAL: 1000,
  TOO_AWAY: 2000,
}));

export const OFFER = registerAs("OFFER", () => ({
  DRIVER_RESPONSE_TIMEOUT: 13000, // 13 seconds
  INITIAL_RADIUS_SIZE: 1000,
  ADD_RADIUS_SIZE_EACH_ITERATION: 200,
  MAX_RADIUS_SIZE: 1800,
}));
