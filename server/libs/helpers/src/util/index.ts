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

import HttpError from "http-errors";
import SecurePassword from "secure-password";
export { getClientIp } from "request-ip";
import logger from "../logger";
import { UnprocessableEntityException } from "@nestjs/common";

const securePassword = new SecurePassword();

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

const IDD_CC_REFS: { [k: string]: string } = {
  "+55": "BR",
};

/**
 * General regexes
 */
export const emailRegex = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i;
export const internationalMobilePhoneRegex = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/;
export const passwordRegex = /^(?=.*\\d)(?=.*[a-z]).{5,}$/;

export type PhoneContactObject = {
  cc: string;
  number: string;
};

type ContactResultObject = {
  value: string;
  field: "emails" | "phones";
};

/**
 * Parses contact object
 *
 * If value is an object with `cc` and `number`
 * properties makes full number and validate it,
 * else validates contact like as email
 * @param value Object or string to verify and parse
 * @throws Error: invalid-email | invalid-idd | invalid-phone
 * @return {object} { contact: string, type: "email" | "phone" }
 */
export function parseContact(
  value: PhoneContactObject | string,
): ContactResultObject {
  if (typeof value === "string") {
    if (!emailRegex.test(value)) {
      throw new Error("invalid-email");
    }

    return { value, field: "emails" };
  }
  const { cc, number } = value;
  const CC_ISO3166 = IDD_CC_REFS[cc];

  if (!CC_ISO3166) {
    throw new Error("invalid-idd");
  }

  const { mobilePhone } = i18nRegex[CC_ISO3166];

  value = `${cc}${number}`;

  if (!mobilePhone.test(value)) {
    throw new Error("invalid-phone");
  }

  return { value, field: "phones" };
}

/**
 * Validates a contact
 *
 * @param {stirng | PhoneContactObject} value
 * @throws UnprocessableEntityException("invalid-contact")
 * @return {object} { value: string, type: "email" | "phone" }
 */
export function isValidContact(value: string): ContactResultObject {
  const isValidMobilePhoneNumber = internationalMobilePhoneRegex.test(value);

  if (!isValidMobilePhoneNumber && !emailRegex.test(value)) {
    throw new UnprocessableEntityException("invalid-contact");
  }

  return {
    field: isValidMobilePhoneNumber ? "phones" : "emails",
    value,
  };
}

/**
 * Creates a password buffer hash
 * @param password
 */
export function hashPassword(password: string | Buffer): Promise<Buffer> {
  return securePassword.hash(
    typeof password === "string" ? Buffer.from(password) : password,
  );
}

/**
 * Compare password
 * @param config.value Plain text value
 * @param config.to Hash value
 * @param config.be Result expected
 * @param errorMsg Error message if expectation fail
 * @throws Http.UnprocessableEntity: wrong-password
 * @returns {Promise<Buffer | boolean>} Buffer if it was necessary to rehash or the verification result
 */
export async function assertPassword({
  value,
  to,
  be,
}: {
  value: string;
  to: Buffer;
  be: boolean;
}): Promise<Buffer | boolean> {
  const passwordValue = Buffer.from(value);
  const result = await securePassword.verify(passwordValue, to);

  if (
    (be && result === SecurePassword.INVALID) ||
    (!be && result === SecurePassword.VALID)
  ) {
    return false;
  }

  if (result === SecurePassword.VALID_NEEDS_REHASH) {
    return hashPassword(passwordValue);
  }

  return true;
}
/**
 * Retries the given function until it succeeds given a number of retries and an interval between them. They are set
 * by default to retry 5 times with 1sec in between. There's also a flag to make the cooldown time exponential
 * @author Daniel Iñigo <danielinigobanos@gmail.com>
 * @author Thijs Koerselman <gitlab.com/0x80>
 * @param {Function} fn - Returns a promise
 * @param {Number} retriesLeft - Number of retries. If -1 will keep retrying
 * @param {Number} interval - Millis between retries. If exponential set to true will be doubled each retry
 * @param {Boolean} exponential - Flag for exponential back-off mode
 * @return {Promise<*>}
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retriesLeft: number = 3,
  interval: number = 1000,
  exponential: boolean = false,
): Promise<T> {
  try {
    const val = await fn();
    return val;
  } catch (error) {
    if (retriesLeft) {
      await new Promise((r) => setTimeout(r, interval));
      return retry(
        fn,
        retriesLeft - 1,
        exponential ? interval * 2 : interval,
        exponential,
      );
    } else throw new Error(`Max retries reached for function ${fn.name}`);
  }
}
