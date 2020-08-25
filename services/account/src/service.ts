import { bootstrap as bootControllers } from "fastify-decorators";
import { bootstrap } from "@gx-mob/http-service";
// For typing support only
import "fastify-multipart";
import "fastify-swagger";

import IndexController from "./controllers/index.controller";
import ContactController from "./controllers/contact.controller";
import SecutiryController from "./controllers/secutiry.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

const service = bootstrap({
  redis,
});

service.register(bootControllers, {
  controllers: [IndexController, ContactController, SecutiryController],
});

export default service;
