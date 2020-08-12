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
import { FastifyRequest, FastifyReply } from "fastify";
import { Controller, GET, ErrorHandler } from "fastify-decorators";
import { HandleError } from "@gx-mob/http-service";

@Controller("/google")
export default class GoogleAuthRegistration {
  public settings = {
    protected: false,
  };

  @ErrorHandler()
  private errorHandler(
    error: Error,
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    HandleError(error, reply);
  }

  @GET("/")
  async handler() {
    return {};
  }
}
