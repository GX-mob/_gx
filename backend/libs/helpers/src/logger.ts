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
  dest,
);

export default logger;
