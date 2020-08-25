import { bootstrap as bootControllers } from "fastify-decorators";
import { bootstrap } from "@gx-mob/http-service";

import SignupController from "./controllers/signup.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

const service = bootstrap({
  redis,
});

service.register(bootControllers, {
  controllers: [SignupController],
});

export default service;
