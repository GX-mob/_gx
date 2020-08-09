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
