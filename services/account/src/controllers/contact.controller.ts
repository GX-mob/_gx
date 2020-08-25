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
import { Controller, Inject, Hook, POST, PATCH } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  SessionService,
  DataService,
  ContactVerificationService,
  GuardHook,
  util,
  HttpError,
} from "@gx-mob/http-service";

import AddBodySchema from "../schemas/contact/add-body.json";
import ConfirmBodySchema from "../schemas/contact/confirm-body.json";
import RemoveBodySchema from "../schemas/contact/remove-body.json";

import { AddContactBodySchema } from "../types/contact/add-body";
import { ConfirmContactBodySchema } from "../types/contact/confirm-body";
import { RemoveContactBodySchema } from "../types/contact/remove-body";

@Controller("/contact")
export default class StandardAuthController {
  @Inject(SessionService)
  private session!: SessionService;

  @Inject(DataService)
  private data!: DataService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @Hook("onRequest")
  async guard(request: FastifyRequest) {
    await GuardHook(this.session, request);
  }

  @POST("/", {
    schema: {
      description: "Request a verification to add the contact",
      body: AddBodySchema,
    },
  })
  async requestVerification(
    request: FastifyRequest<{ Body: AddContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { value } = util.isValidContact(request.body.contact);

    await this.verify.request(value);

    reply.code(202).send();
  }

  @PATCH("/add", {
    schema: {
      description: "Confirm the verification to add",
      body: ConfirmBodySchema,
    },
  })
  async add(
    request: FastifyRequest<{ Body: ConfirmContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { user } = request.session;
    const { contact, code } = request.body;
    const { value, field } = util.isValidContact(contact);

    const valid = await this.verify.verify(value, code);

    if (!valid) {
      throw new HttpError.UnprocessableEntity("wrong-code");
    }

    const update = {
      [field]: [...(user[field] || []), contact],
    };

    await this.data.users.update({ _id: user._id }, update);

    reply.code(201).send();
  }

  @PATCH("/remove", {
    schema: {
      description: "Remove a contact",
      body: RemoveBodySchema,
    },
  })
  async remove(
    request: FastifyRequest<{ Body: RemoveContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { user } = request.session;
    const { field, value } = util.isValidContact(request.body.contact);

    /**
     * Prevent removing the last contact or
     * the second factor authentication
     */
    if (
      [...user.phones, ...(user.emails || [])].length === 1 ||
      user["2fa"] === value
    ) {
      throw new HttpError.UnprocessableEntity("not-allowed");
    }

    const updated = [...(user[field] || [])];
    const index = updated.indexOf(value);

    updated.splice(index, 1);

    await this.data.users.update({ _id: user._id }, { [field]: updated });

    reply.send();
  }
}
