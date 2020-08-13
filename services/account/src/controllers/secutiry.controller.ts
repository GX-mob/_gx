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
import { Controller, Inject, PATCH, PUT } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import { DataService } from "@gx-mob/http-service";
import bcrypt from "bcrypt";
import HttpErrors from "http-errors";

import UpdateCredentialBodySchema from "../schemas/security/credential-body.json";
import Update2FABodySchema from "../schemas/security/2fa-body.json";

import { UpdateCredentialBodySchema as IUpdateCredentialBodySchema } from "../types/security/credential-body";
import { Update2FABodySchema as IUpdate2FABodySchema } from "../types/security/2fa-body";

@Controller("/secutiry")
export default class StandardAuthController {
  @Inject(DataService)
  private data!: DataService;

  @PATCH("/password", {
    schema: {
      description: "Update password",
      body: UpdateCredentialBodySchema,
    },
  })
  async updatePassword(
    request: FastifyRequest<{ Body: IUpdateCredentialBodySchema }>,
    reply: FastifyReply
  ) {
    const { user } = request.session;
    const { current, new: newPassword } = request.body;

    if (user.password) {
      await this.assertPasswords(
        {
          value: current,
          to: user.password,
          be: true,
        },
        "wrong-credential"
      );

      await this.assertPasswords(
        {
          value: newPassword,
          to: user.password,
          be: false,
        },
        "unchanged"
      );
    }

    const password = await bcrypt.hash(newPassword, 10);

    await this.data.users.model.updateOne({ _id: user._id }, { password });

    return reply.send();
  }

  async assertPasswords(
    {
      value,
      to,
      be,
    }: {
      value: string;
      to: string;
      be: boolean;
    },
    errorMsg: string
  ) {
    const assert = await bcrypt.compare(value, to);

    if ((be && !assert) || (!be && assert)) {
      throw new HttpErrors.UnprocessableEntity(errorMsg);
    }
  }

  @PATCH("/2fa", {
    schema: {
      description: "Update second factor authentication",
      body: Update2FABodySchema,
    },
  })
  async update2FA(
    request: FastifyRequest<{ Body: IUpdate2FABodySchema }>,
    reply: FastifyReply
  ) {}
}
