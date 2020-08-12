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
import pino from "pino";

const dest = pino.destination({ sync: false });

const logger = pino(
  /* istanbul ignore next */
  process.env.NODE_ENV !== "production"
    ? {
        prettyPrint: {
          levelFirst: true,
        },
        prettifier: require("pino-pretty"),
      }
    : {},
  dest
);

// asynchronously flush every 10 seconds to keep the buffer empty
// in periods of low activity
/* istanbul ignore next */
setInterval(function () {
  logger.flush();
}, 10000).unref();

export default logger;
