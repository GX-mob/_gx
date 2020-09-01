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
import { Injectable } from "@nestjs/common";
import { User } from "@app/repository";
import { ContactVerificationService } from "@app/contact-verification";
import { DataService } from "@app/data";
import { SessionService } from "@app/session";
import { FastifyRequest } from "fastify";
import { util } from "@app/helpers";

@Injectable()
export class AuthService {
  constructor(
    private readonly data: DataService,
    private readonly verify: ContactVerificationService,
    private readonly session: SessionService,
  ) {}

  getUser(phone: string) {
    return this.data.users.get({ phones: phone });
  }

  createVerification(target: string) {
    if (process.env.NODE_ENV === "development") {
      return Promise.resolve();
    }

    return this.verify.request(target);
  }

  checkVerification(target: string, code: string) {
    return this.verify.verify(target, code);
  }

  createSession(user: User, request: FastifyRequest) {
    return this.session.create(
      user,
      request.headers["user-agent"] as string,
      util.getClientIp(request.raw),
    );
  }
}
