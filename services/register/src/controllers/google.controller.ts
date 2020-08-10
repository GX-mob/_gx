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
import { Controller } from "fastify-decorators";
import { ControllerAugment } from "@gx-mob/http-service";

@Controller("/google-auth")
export default class GoogleAuthRegistration extends ControllerAugment {
  public settings = {
    managedErrors: ["UnprocessableEntityError", "UnauthorizedError"],
  };
}
