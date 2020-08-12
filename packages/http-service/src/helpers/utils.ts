import logger from "./logger";

/* istanbul ignore next */
export const handleRejectionByUnderHood = (promise: Promise<any>) => {
  promise.catch((error) => logger.error(error));
};

const CC = process.env.COUNTRY_CODE_ISO3166;

const i18nRegex = {
  BR: {
    mobilePhone: /^(\+?[1-9]{2,3})?[1-9]{2}9[6-9][0-9]{3}[0-9]{4}$/,
  },
};

/**
 * Mobile phone validation
 */
export const mobilePhone = i18nRegex[CC].mobilePhone;
