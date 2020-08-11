import logger from "./logger";
import { FastifyReply } from "fastify";
import pino from "pino";
import createError from "http-errors";

/* istanbul ignore next */
export const handleRejectionByUnderHood = (promise: Promise<any>) => {
  promise.catch((error) => logger.error(error));
};

export const manageControllerError = (
  managed: string[],
  error: Error,
  reply: FastifyReply,
  logger: pino.Logger
) => {
  if (managed.includes(error.constructor.name)) {
    return reply.send(error);
  }

  logger.error(error);

  reply.send(createError(500));
};

export const phoneRegex = /^(\+?[1-9]{2,3})?[1-9]{2}9[6-9][0-9]{3}[0-9]{4}$/;
