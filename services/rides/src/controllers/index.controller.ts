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
import { FastifyInstance, FastifyReply } from "fastify";
import {
  Controller,
  Inject,
  FastifyInstanceToken,
  Hook,
  GET,
  PUT,
} from "fastify-decorators";
import { FastifyRequest } from "fastify";
import {
  SessionService,
  DataService,
  CacheService,
  GuardHook,
  HttpError,
  Models,
} from "@gx-mob/http-service";
import { distance as Distance } from "@gx-mob/geo-helper";

import CreateRideJsonBodySchema from "../schemas/create-ride.json";
import { CreateRideBodySchema as ICreateRideBodySchema } from "../types/create-ride";

import PricesStatusResponse from "../schemas/prices-status-response.json";
import { PricesStatusResponse as IPricesStatusResponse } from "../types/prices-status-response";

@Controller("/")
export default class IndexController {
  @Inject(FastifyInstanceToken)
  private instance!: FastifyInstance;

  @Inject(SessionService)
  private session!: SessionService;

  @Inject(DataService)
  private data!: DataService;

  @Inject(CacheService)
  private cache!: CacheService;

  @Hook("onRequest")
  async guard(request: FastifyRequest) {
    await GuardHook(this.session, request);
  }

  constructor() {
    /**
     * Route schemas
     */
    this.instance.addSchema({
      $id: "routes",
      type: "object",
      definitions: {
        point: {
          $id: "#point",
          type: "object",
          properties: {
            coord: { type: "array", items: { type: "integer" } },
            primary: { type: "string" },
            secondary: { type: "string" },
            district: { type: "string" },
          },
        },
        route: {
          $id: "#route",
          type: "object",
          properties: {
            start: {
              $ref: "#point",
            },
            waypoints: {
              type: "array",
              items: { $ref: "#point" },
            },
            end: {
              $ref: "#point",
            },
            path: { type: "string" },
            distance: { type: "integer" },
          },
        },
      },
    });

    this.instance.addSchema({
      $id: "pendencie",
      type: "object",
      properties: {
        pid: { type: "integer" },
        amount: { type: "integer" },
        ride: { type: "string" },
      },
    });
  }

  @GET("/:pid", {
    schema: {
      response: {
        "200": {
          title: "Ride info response",
          type: "object",
          properties: {
            pid: { type: "string" },
            voyager: {
              $ref: "userPublicData#",
            },
            route: {
              $ref: "routes#route",
            },
            type: { type: "integer", enum: [1, 2] },
            payMethod: { type: "integer", enum: [1, 2] },
            driver: {
              $ref: "userPublicData#",
            },
          },
        },
      },
    },
  })
  async getHandler(request: FastifyRequest<{ Params: { pid: string } }>) {
    const { pid } = request.params;

    const ride = await this.data.rides.get({ pid });

    if (!ride) {
      throw new HttpError.UnprocessableEntity("ride-not-found");
    }

    const { pendencies, ...publicData } = ride;

    if (request.session.user._id === ride.voyager) {
      return publicData;
    }

    const hasPermission = await this.cache.get("rides:readPermission", pid);

    if (pid !== hasPermission) {
      throw new HttpError.Forbidden("no-permission");
    }

    return publicData;
  }

  @PUT("/", {
    schema: {
      body: CreateRideJsonBodySchema,
      response: {
        "201": {
          type: "object",
          properties: {
            pid: { type: "string" },
            pendencies: {
              type: "array",
              items: { $ref: "pendencie#" },
            },
            amount: { type: "integer" },
          },
        },
      },
    },
  })
  async putHandler(
    request: FastifyRequest<{ Body: ICreateRideBodySchema }>,
    reply: FastifyReply
  ) {
    const { _id } = request.session.user;

    const { route, type, payMethod } = request.body;

    const pendencies = await Models.PendencieModel.find({ issuer: _id });

    const distance = Distance.path(route.path);

    const { pid } = await this.data.rides.create({
      voyager: _id,
      route,
      type,
      pendencies,
      payMethod,
    });

    return reply.code(201).send({ pid, pendencies });
  }

  @GET("/", {
    schema: {
      response: {
        "200": PricesStatusResponse,
      },
    },
  })
  async serviceStatus(request: FastifyRequest, reply: FastifyReply) {
    return reply.send<IPricesStatusResponse>([
      {
        type: 1, // Normal
        values: {
          per_kilometer: 1.1,
          per_minute: 0.25,
          kilometer_multipler: 0.01,
          minute_multipler: 0.05,
          over_business_time_km_add: 0.01,
          over_business_time_minute_add: 0.05,
        },
      },
      {
        type: 2, // VIG
        values: {
          per_kilometer: 1.5,
          per_minute: 0.35,
          kilometer_multipler: 0.03,
          minute_multipler: 0.1,
          over_business_time_km_add: 0.03,
          over_business_time_minute_add: 0.1,
        },
      },
    ]);
  }

  private getPathPrice(path: string): number {
    const distance = Distance.path(path);

    return distance;
  }

  private getTimePrice(time: number): number {
    return 0;
  }
}
