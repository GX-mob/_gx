import { registerAs } from "@nestjs/config";
import ms from "ms";

export const MATCH = registerAs("MATCH", () => ({
  MAX_ITERATION: 60,
  ITERATION_INTERVAL: ms("1 second"),
  TOO_AWAY: 2000,
}));

export const OFFER = registerAs("OFFER", () => ({
  DRIVER_RESPONSE_TIMEOUT: ms("13 seconds"), // 13 seconds
  INITIAL_RADIUS_SIZE: 1000,
  ADD_RADIUS_SIZE_EACH_ITERATION: 200,
  MAX_RADIUS_SIZE: 1800,
  SAFE_CANCELATION_WINDOW: ms("3 minutes"), // 3 minutes,
}));
