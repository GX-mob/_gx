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
import { PriceDetail } from "@gx-mob/service-configure/dist/models/price";
import { zonedTimeToUtc } from "date-fns-tz";

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

  @GET("/:area/:subArea", {
    schema: {
      response: {
        "200": PricesStatusResponse,
      },
    },
  })
  async servicePricesStatus(
    request: FastifyRequest<{ Params: { area: string; subArea: string } }>,
    reply: FastifyReply
  ) {
    const { area, subArea } = request.params;

    const prices = this.instance.getPrice(area, subArea);

    reply.send<IPricesStatusResponse>(prices);
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

    /**
     * Get user pendencies
     */
    const pendencies = await Models.PendencieModel.find({ issuer: _id });

    const { route, type, payMethod, country, area, subArea } = request.body;

    /**
     * Calculate rides costs
     */
    const costs = this.getCosts(request.body);
    const base = costs.duration.total + costs.distance.total;
    const total = pendencies.reduce((v, pendencie) => {
      return v + pendencie.amount;
    }, base);

    const { pid } = await this.data.rides.create({
      voyager: _id,
      route,
      type,
      pendencies,
      payMethod,
      country,
      area,
      subArea,
      costs: {
        ...costs,
        base,
        total,
      },
    });

    reply.code(201).send({ pid, pendencies });
  }

  private getCosts(request: ICreateRideBodySchema) {
    const { type, area, subArea } = request;

    /**
     * Get the price of ride type
     */
    const price = this.instance
      .getPrice(area, subArea)
      .find((price) => price.type === type);

    if (!price) {
      throw new HttpError.UnprocessableEntity("invalid-ride-type");
    }

    const isBusinessTime = this.isBusinessTime(request.country);

    const duration = this.durationPrice(
      request.route.duration,
      price,
      isBusinessTime
    );
    const distance = this.distancePrice(
      request.route.distance,
      price,
      isBusinessTime
    );

    return { duration, distance };
  }

  private isBusinessTime(country: string) {
    const date = zonedTimeToUtc(new Date(), country);
    const hour = date.getHours();
    const isSunday = date.getDay() > 0;
    return isSunday || (hour > 9 && hour < 18);
  }

  private durationPrice(
    duration: number,
    price: PriceDetail,
    isBusinessTime: boolean
  ): {
    total: number;
    aditionalForLongRide: number;
    aditionalForOutBusinessTime: number;
  } {
    /**
     * Default price multiplier
     */
    let multipler = price.perMinute;
    let aditionalFoLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional multipler to rides long than 40 minutes.
     */
    if (duration > 40) {
      multipler += price.minuteMultipler;
      aditionalFoLongRide = duration * price.minuteMultipler;
    }

    /**
     * Add aditional to non business time rides
     */
    if (!isBusinessTime) {
      multipler += price.overBusinessTimeMinuteAdd;
      aditionalForOutBusinessTime = duration * price.minuteMultipler;
    }

    return {
      total: duration * multipler,
      aditionalForLongRide: aditionalFoLongRide,
      aditionalForOutBusinessTime,
    };
  }

  private distancePrice(
    distance: number,
    price: PriceDetail,
    isBusinessTime: boolean
  ): {
    total: number;
    aditionalForLongRide: number;
    aditionalForOutBusinessTime: number;
  } {
    /**
     * Default price multiplier
     */
    let multipler = price.perKilometer;
    let aditionalFoLongRide = 0;
    let aditionalForOutBusinessTime = 0;

    /**
     * Aditional multipler to rides long than 10 km
     */
    if (distance > 10000) {
      multipler += price.overBusinessTimeKmAdd;
      aditionalFoLongRide = distance * aditionalFoLongRide;
    }

    /**
     * Add aditional to non business time rides
     */
    if (!isBusinessTime) {
      multipler += price.overBusinessTimeKmAdd;
      aditionalForOutBusinessTime = distance * price.overBusinessTimeKmAdd;
    }

    return {
      total: multipler * distance,
      aditionalForLongRide: aditionalFoLongRide,
      aditionalForOutBusinessTime,
    };
  }
}
