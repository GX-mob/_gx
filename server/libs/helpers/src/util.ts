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
import SecurePassword from "secure-password";
export { getClientIp } from "request-ip";
import logger from "./logger";
import { UnprocessableEntityException } from "@nestjs/common";
import { Logger } from "pino";
import validator from "validator";

export const securePassword = new SecurePassword();

export const handleRejectionByUnderHood = (
  promise: Promise<unknown>,
  loggerInstance: Logger = logger,
) => {
  promise.catch((error) => loggerInstance.error(error));
};

/**
 * General regexes
 */
export const passwordRegex = /^(?=.*\\d)(?=.*[a-z]).{5,}$/;

export type PhoneContactObject = {
  cc: string;
  number: string;
};

export type ContactResultObject = {
  value: string;
  field: "emails" | "phones";
};

/**
 * Validates a contact
 *
 * @param {stirng} value
 * @throws UnprocessableEntityException("invalid-contact")
 * @return {object} { value: string, type: "email" | "phone" }
 */
export function isValidContact(value: string): ContactResultObject {
  const isMobilePhone = validator.isMobilePhone(value);

  if (!isMobilePhone && !validator.isEmail(value)) {
    throw new UnprocessableEntityException("invalid-contact");
  }

  return {
    field: isMobilePhone ? "phones" : "emails",
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
 * @param value Plain text value
 * @param to Hashed password
 * @returns {Promise<Buffer | boolean>} Buffer if it was necessary to rehash or the verification result
 */
export async function assertPassword(
  value: string,
  to: Buffer,
): Promise<Buffer | boolean> {
  const passwordValue = Buffer.from(value);
  const result = await securePassword.verify(passwordValue, to);

  switch (result) {
    case SecurePassword.VALID:
      return true;
    case SecurePassword.VALID_NEEDS_REHASH:
      return hashPassword(passwordValue);
    default:
      return false;
  }
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
    } else
      throw new Error(
        `Max retries reached for function ${fn.name}, last error: ${error.message}`,
      );
  }
}

/**
 * Check if object has own property securely
 * @param obj
 * @param prop
 */
export function hasProp(obj: any, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Hide email
 */
export function hideEmail(
  email: string,
  visibleCharsCount: number = 3,
): string {
  const [name, domain] = email.split("@");
  const hiddenEmail = `${name
    .slice(0, visibleCharsCount)
    .padEnd(name.length, "*")}@${domain}`;
  return hiddenEmail;
}
