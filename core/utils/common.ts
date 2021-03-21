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

export const handleRejectionByUnderHood = (
  promise: Promise<unknown>,
  loggerFunction: Function = console.error,
) => promise.catch((error) => loggerFunction(error));

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
 * for check user input provided prop.
 * @param obj
 * @param prop
 */
export function hasProp<T extends object>(obj: T, prop: keyof T) {
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
