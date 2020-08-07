import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import "reflect-metadata";
import { bootstrap } from "@gx-mob/http-service";
import { resolve } from "path";

const isProduction = process.env.NODE_ENV === "production";

export const start = async () => {
  try {
    if (!isProduction) {
      const MongoMemoryServer = require("mongodb-memory-server"); // eslint-disable-line @typescript-eslint/no-var-requires
      const mongoServer = new MongoMemoryServer();
      process.env.MONGO_URI = await mongoServer.getUri();
    }

    const redis = isProduction
      ? process.env.REDIS_URI
      : new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires

    const instance = bootstrap({
      directory: resolve(__dirname, "../"),
      redis,
    });

    await instance.ready();

    await instance.listen(
      parseInt(process.env.PORT) || 8080,
      process.env.IP || "0.0.0.0"
    );

    console.log(instance.printRoutes());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();

process.on("uncaughtException", (error) => {
  console.log(error);
});
process.on("unhandledRejection", (error) => {
  console.log(error);
  process.abort();
});
