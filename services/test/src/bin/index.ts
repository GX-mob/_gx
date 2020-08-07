import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import "reflect-metadata";
import { MongoMemoryServer } from "mongodb-memory-server";

import { bootstrap } from "@gx-mob/http-service";
import IORedisMock from "ioredis-mock";
import { resolve } from "path";

export const start = async () => {
  try {
    const mongoServer = new MongoMemoryServer();
    process.env.MONGO_URI = await mongoServer.getUri();

    const instance = bootstrap({
      directory: resolve(__dirname, "../"),
      redis: new IORedisMock(),
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
