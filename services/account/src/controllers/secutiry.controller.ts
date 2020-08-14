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
import { Controller, Inject, PATCH } from "fastify-decorators";
import { FastifyRequest, FastifyReply } from "fastify";
import { DataService, HttpError, utils } from "@gx-mob/http-service";
import bcrypt from "bcrypt";

import UpdateCredentialBodySchema from "../schemas/security/credential-body.json";
import Enable2FABodySchema from "../schemas/security/enable-2fa-body.json";
import Disable2FABodySchema from "../schemas/security/disable-2fa-body.json";

import { UpdateCredentialBodySchema as IUpdateCredentialBodySchema } from "../types/security/credential-body";
import { Enable2FABodySchema as IEnable2FABodySchema } from "../types/security/enable-2fa-body";
import { Disable2FABodySchema as IDisable2FABodySchema } from "../types/security/disable-2fa-body";

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
      await utils.assertPassword(
        {
          value: current,
          to: user.password,
          be: true,
        },
        "wrong-credential"
      );

      await utils.assertPassword(
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

  @PATCH("/2fa/enable", {
    schema: {
      description: "Enable second factor authentication",
      body: Enable2FABodySchema,
    },
  })
  async enable2FA(
    request: FastifyRequest<{ Body: IEnable2FABodySchema }>,
    reply: FastifyReply
  ) {
    this.passwordRequired(request);

    const { value: contact } = utils.isValidContact(request.body.target);
    const { user } = request.session;

    this.hasContact(contact, user);

    await this.data.users.update({ _id: user._id }, { "2fa": contact });

    return reply.send();
  }

  @PATCH("/2fa/disable", {
    schema: {
      description: "Disable second factor authentication",
      body: Disable2FABodySchema,
    },
  })
  async disable2FA(
    request: FastifyRequest<{ Body: IDisable2FABodySchema }>,
    reply: FastifyReply
  ) {
    this.passwordRequired(request);
    const { user } = request.session;

    await utils.assertPassword(
      {
        value: request.body.password,
        to: user.password as string,
        be: true,
      },
      "wrong-password"
    );

    this.data.users.update({ _id: user._id }, { "2fa": "" });
  }

  /**
   * Useful methods
   */
  /** */
  private passwordRequired(request: FastifyRequest): void {
    if (!request.session.user.password) {
      throw new HttpError.UnprocessableEntity("password-required");
    }
  }

  private hasContact(contact: string, user: any) {
    if (!user.phones.includes(contact) && !user.emails.includes(contact)) {
      throw new HttpError.UnprocessableEntity("not-own-contact");
    }
  }
}
