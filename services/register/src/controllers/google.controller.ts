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
import {
  FastifyInstanceToken,
  Controller,
  Inject,
  POST,
} from "fastify-decorators";
import { FastifyInstance, FastifyRequest } from "fastify";
import {
  CacheService,
  DataService,
  ContactVerificationService,
  SessionService,
} from "@gx-mob/http-service";
import httpErrors from "http-errors";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";
import { Http2ServerResponse } from "http2";

@Controller("/google-auth")
export default class GoogleAuthRegistration {
  private managedErrors = ["UnprocessableEntityError", "UnauthorizedError"];

  @Inject(FastifyInstanceToken)
  private instance!: FastifyInstance;

  @Inject(CacheService)
  private cache!: CacheService;

  @Inject(ContactVerificationService)
  private verify!: ContactVerificationService;

  @Inject(DataService)
  private data!: DataService;

  @Inject(SessionService)
  private sessions!: SessionService;
}

/*
@Controller("/google-auth")
export default class GoogleAuthRegistration {

  @Inject(CacheService)
  private cache!: CacheService

  @Inject(DataService)
  private data!: DataService

  @POST("/save-phone")
  async savePhon(request): Promise<any> {

    const { phone, uid: user_id } = request.body;

    const verification = this.cache.get("verifications", phone);

    if(!verification.validated){
      throw new httpErrors.error();
    }

    const user = this.data.users.get({ _id: user_id });

    if(!user){
      throw new httpErrors.error();
    }

    await this.data.users.update({ _id: user_id }, { phone })

  }

}
*/
