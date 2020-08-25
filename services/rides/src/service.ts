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
import { bootstrap as bootControllers } from "fastify-decorators";
import { bootstrap } from "@gx-mob/http-service";
import configure from "@gx-mob/service-configure";
import IndexController from "./controllers/index.controller";

const redis = process.env.REDIS_URI || new (require("ioredis-mock"))(); // eslint-disable-line @typescript-eslint/no-var-requires
const service = bootstrap({
  redis,
});

service.register(bootControllers, { controllers: [IndexController] });

/**
 * Connects to the service configuration database
 */
service.register(configure);

export default service;
