/**
 * GX - Corridas
 * Copyright (C) 2020  Fernando Costa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { resolve } from "path";
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  require("dotenv").config({ path: resolve(__dirname, "../../", ".env.dev") }); // eslint-disable-line
}

import { bootstrap } from "@gx-mob/http-service";

// For typing support only
import "fastify-multipart";
import "fastify-swagger";

import service from "../service";

(async function start() {
  try {
    if (!process.env.MONGO_URI && !isProduction) {
      const MongoMemoryServer = require("mongodb-memory-server").default; // eslint-disable-line @typescript-eslint/no-var-requires
      const mongoServer = new MongoMemoryServer();
      process.env.MONGO_URI = await mongoServer.getUri();
    }

    await service.ready();

    await service.listen(
      Number(process.env.PORT as string) || 8080,
      process.env.IP || "0.0.0.0"
    );

    console.log(service.printRoutes());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();

/**
 * Needed to App Engine auto scale
 */
module.exports = service.server;

process.on("uncaughtException", (error) => {
  console.log(error);
});
process.on("unhandledRejection", (error) => {
  console.log(error);
  process.abort();
});
