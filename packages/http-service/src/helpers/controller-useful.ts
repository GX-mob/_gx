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
import HttpError from "http-errors";
import logger from "./logger";
import { SessionService } from "../services";
import { getClientIp } from "request-ip";

export async function GuardHook(
  service: SessionService,
  request: FastifyRequest,
  alloweds: number[]
) {
  if (!request.headers.authorization) {
    throw new HttpError.Unauthorized();
  }

  const ip = getClientIp(request.raw);
  const token = request.headers.authorization.replace("Bearer ", "");
  const session = await service.verify(token, ip);

  if (alloweds && !service.hasPermission(session, alloweds)) {
    throw new HttpError.Forbidden("unauthorized");
  }

  request.session = session;
}

export function HandleError(error: Error, reply: FastifyReply) {
  if (
    (error as any).validation || // ? catch ajv validation errors ?
    HttpError.isHttpError(error)
  ) {
    return reply.send(error);
  }

  logger.error(error);

  return reply.send(HttpError(500));
}
