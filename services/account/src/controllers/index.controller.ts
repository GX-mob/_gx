/*
  GX - Corridas
  Copyright (C) 2020  Fernando Costa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Controller, Inject, GET, POST, PUT, Hook } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import { SessionService, DataService, GuardHook } from "@gx-mob/http-service";

import UpdateProfileBodySchema from "../schemas/profile-body.json";
import UpdateAvatarBodySchema from "../schemas/avatar-body.json";

import { UpdateProfileBodySchema as IUpdateProfileBodySchema } from "../types/profile-body";
import { UpdateAvatarBodySchema as IUpdateAvatarBodySchema } from "../types/avatar-body";

@Controller("/profile")
export default class StandardAuthController {
  @Inject(SessionService)
  private session!: SessionService;

  @Inject(DataService)
  private data!: DataService;

  @Hook("onRequest")
  async guard(request: FastifyRequest) {
    await GuardHook(this.session, request);
  }

  @GET("/", {
    schema: {
      description: "Get user data",
      response: {
        "200": {
          id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          phones: { type: "array", items: { type: "string" } },
          emails: { type: "array", items: { type: "string" } },
          cpf: { type: "string" },
          birth: { type: "string" },
          avatar: { type: "string" },
          groups: { type: "string" },
        },
      },
    },
  })
  async getHandler(request: FastifyRequest, reply: FastifyReply) {
    const {
      _id,
      firstName,
      lastName,
      phones,
      emails,
      cpf,
      birth,
      avatar,
      groups,
    } = request.session.user;

    return {
      id: _id,
      firstName,
      lastName,
      phones,
      emails,
      cpf,
      birth,
      avatar,
      groups,
    };
  }

  @PUT("/", {
    schema: {
      body: UpdateProfileBodySchema,
    },
  })
  async updateHandler(
    request: FastifyRequest<{ Body: IUpdateProfileBodySchema }>,
    reply: FastifyReply
  ) {
    const { session } = request;
    const { firstName, lastName } = request.body;

    const update: any = {};

    if (firstName) {
      update.firstName = firstName;
    }

    if (lastName) {
      update.lastName = lastName;
    }

    await this.data.users.update({ _id: session.user._id }, request.body);
    await this.data.sessions.updateCache({ _id: session._id });

    return reply.send();
  }

  @PUT("/avatar", {
    schema: {
      description: "Update avatar",
      body: UpdateAvatarBodySchema,
    },
  })
  async uploadAvatar(
    request: FastifyRequest<{ Body: IUpdateAvatarBodySchema }>,
    reply: FastifyReply
  ) {}
}
