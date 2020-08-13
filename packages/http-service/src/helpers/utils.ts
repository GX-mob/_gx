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
import logger from "./logger";
import HttpError from "http-errors";
export { getClientIp } from "request-ip";

const CC = process.env.COUNTRY_CODE_ISO3166 as string;

/* istanbul ignore next */
export const handleRejectionByUnderHood = (promise: Promise<any>) => {
  promise.catch((error) => logger.error(error));
};

type RegexGlobalsObject = {
  [k: string]: {
    mobilePhone: RegExp;
  };
};

const i18nRegex: RegexGlobalsObject = {
  BR: {
    mobilePhone: /^(\+?[1-9]{2,3})?[1-9]{2}9[6-9][0-9]{3}[0-9]{4}$/,
  },
};

/**
 * General regex
 */
export const regexes = {
  emailRegex: /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+\.([a-z]+)?$/i,
  ...i18nRegex[CC],
};
export const emailRegex = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+\.([a-z]+)?$/i;
export const mobileNumberRegex = i18nRegex[CC].mobilePhone;

type ContactPhoneObject = {
  cc: string;
  number: string;
};

/**
 * Parses contact object
 *
 * If value is an object with `cc` and `number`
 * properties makes full number and validate it,
 * else validates contact like as email
 * @param value
 * @throws UnprocessableEntity: invalid-number
 * @return {object} { contact: string, type: "email" | "phone" }
 */
export function parseContact(
  value: ContactPhoneObject | string
): { contact: string; type: "email" | "phone" } {
  const type = typeof value === "string" ? "email" : "phone";

  const contact =
    type === "email"
      ? (value as string)
      : `${(value as any).cc}${(value as any).number}`;

  const regex = type === "phone" ? mobileNumberRegex : emailRegex;

  if (!regex.test(contact)) {
    throw new HttpError.UnprocessableEntity("invalid-contact");
  }

  return { contact, type };
}
