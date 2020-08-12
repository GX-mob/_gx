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

import { Controller, POST, PUT, DELETE } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import { ControllerAugment } from "@gx-mob/http-service";
import HttpErrors from "http-errors";

import AddBodySchema from "../schemas/contact/add-body.json";
import ConfirmBodySchema from "../schemas/contact/confirm-body.json";
import RemoveBodySchema from "../schemas/contact/remove-body.json";

import { AddContactBodySchema } from "../types/contact/add-body";
import { ConfirmContactBodySchema } from "../types/contact/confirm-body";
import { RemoveContactBodySchema } from "../types/contact/remove-body";

@Controller("/contact")
export default class StandardAuthController extends ControllerAugment {
  public settings = {
    protected: true,
  };

  @POST("/", {
    schema: {
      description: "Request a verification to add the contact",
      body: AddBodySchema,
    },
  })
  private async request(
    request: FastifyRequest<{ Body: AddContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { value } = this.contact(request.body.contact);

    await this.verify.request(value);

    return reply.code(202).send();
  }

  @PUT("/", {
    schema: {
      description: "Confirm the verification to add",
      body: ConfirmBodySchema,
    },
  })
  private async confirm(
    request: FastifyRequest<{ Body: ConfirmContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { user } = request.session;
    const { code } = request.body;
    const { value, type } = this.contact(request.body.contact);

    const valid = await this.verify.verify(value, code);

    if (!valid) {
      throw new HttpErrors.UnprocessableEntity("wrong-code");
    }

    const update = {
      [type]: [...user[type], value],
    };

    await this.data.users.update({ _id: user._id }, update);

    return reply.code(201).send();
  }

  @DELETE("/", {
    schema: {
      description: "Remove a contact",
      body: RemoveBodySchema,
    },
  })
  private async remove(
    request: FastifyRequest<{ Body: RemoveContactBodySchema }>,
    reply: FastifyReply
  ) {
    const { user } = request.session;
    const { value, type } = this.contact(request.body.contact);

    if (
      // Prevent removing the last contact
      [...user.phones, ...user.emails].length === 1 ||
      // Prevent removing the second factor authentication
      user["2fa"] === value
    ) {
      throw new HttpErrors.UnprocessableEntity("not-allowed");
    }

    const updated = [...user[type]];
    const index = updated.indexOf(value);

    updated.splice(index, 1);

    await this.data.users.update({ _id: user._id }, { [type]: updated });

    return reply.send();
  }

  private contact(contact: AddContactBodySchema["contact"]) {
    if (typeof contact === "string") {
      return { value: contact, type: "emails" };
    }

    return { value: `${contact.cc}${contact.number}`, type: "phones" };
  }
}
