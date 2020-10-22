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
import { Logger } from "pino";
import validator from "validator";

export const securePassword = new SecurePassword();

export const handleRejectionByUnderHood = (
  promise: Promise<unknown>,
  loggerInstance: Logger = logger,
) => promise.catch((error) => loggerInstance.error(error));

/**
 * General regexes
 */
export const passwordRegex = /^(?=.*\\d)(?=.*[a-z]).{5,}$/;
/**
 * Validates a contact, mobile phone number or string
 */
export function isValidContact(value: string): boolean {
  return validator.isMobilePhone(value) || validator.isEmail(value);
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
  to: string,
): Promise<Buffer | boolean> {
  const passwordValue = Buffer.from(value);
  const comparedValue = Buffer.from(to, "base64");
  const result = await securePassword.verify(passwordValue, comparedValue);

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
    } else throw error;
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
  hiddenProvider?: number,
): string {
  let [name, domain] = email.split("@");

  if (typeof hiddenProvider === "number") {
    domain = domain.slice(0, hiddenProvider).padEnd(domain.length, "*");
  }

  const hiddenEmail = `${name
    .slice(0, visibleCharsCount)
    .padEnd(name.length, "*")}@${domain}`;
  return hiddenEmail;
}

export function decimalAdjust(
  value: number,
  exp: number = 0,
  type: "round" | "floor" | "ceil" = "round",
): number {
  if (exp === 0) {
    return Math[type](value);
  }

  // Shift
  const shiftValue = value.toString().split("e");
  value = Math[type](
    Number(shiftValue[0] + "e" + (shiftValue[1] ? +shiftValue[1] - exp : -exp)),
  );
  // Shift back
  const shiftBack = value.toString().split("e");
  return Number(
    shiftBack[0] + "e" + (shiftBack[1] ? +shiftBack[1] + exp : exp),
  );
}

/**
 * Mix of `handleRejectionByUnderHood` and `retry`
 */
export function retryUnderHood(...args: Parameters<typeof retry>) {
  return handleRejectionByUnderHood(retry(...args));
}
