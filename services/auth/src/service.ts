import { bootstrap } from "@gx-mob/http-service";
import StandardController from "./controllers/standard.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

const service = bootstrap({
  controllers: [StandardController],
  redis,
});

export default service;
