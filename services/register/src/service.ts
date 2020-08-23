// TODO implement secure-password npm package
import { bootstrap } from "@gx-mob/http-service";

import SignupController from "./controllers/signup.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

const service = bootstrap({
  controllers: [SignupController],
  redis,
});

export default service;
