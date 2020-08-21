import { bootstrap } from "@gx-mob/http-service";

import IndexController from "./controllers/index.controller";
import ContactController from "./controllers/contact.controller";
import SecutiryController from "./controllers/secutiry.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

const service = bootstrap({
  controllers: [IndexController, ContactController, SecutiryController],
  redis,
});

export default service;
