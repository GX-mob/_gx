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
import { Controller, Inject, POST } from "fastify-decorators";
import { FastifyRequest } from "fastify";
import {
  CacheService,
  DataService,
  ContactVerificationService,
  SessionService,
} from "@gx-mob/http-service";
import httpErrors from "http-errors";
import { isValidCPF } from "@brazilian-utils/brazilian-utils";

@Controller("/apple-id")
export default class AppleIDRegistration {}
