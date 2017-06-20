import _ from 'lodash';
import logger from 'morgan';
import c from '../../constants';
import config from '../../../config';

/**
 * Request logger middleware
 * @param {Array} env
 * @return {function}
 */
export function requestLoggerMiddleware(env) {
  env = (env === undefined) ? [c.DEVELOPMENT, c.STAGING, c.PRODUCTION] : env;
  env = Array.isArray(env) ? env : [env];
  return _.includes(env, config.env) ? logger(config.logFormat) : (req, res, next) => next();
}

/**
 * Add some utilities to request object
 * @return {function}
 */
export function requestUtilsMiddleware() {
  return (req, res, next) => {
    req.messages = {
      errors: [],
      warnings: [],
      validation: {},
    };
    next();
  };
}

// eslint-disable-next-line no-unused-vars
export function apiResponse() {
  return (req, res) => {
    const code = res.statusCode;
    const { status, message, data } = req.resData;
    const { status, message, data, meta } = req.resData;
    return res.json({
      code,
      status,
      message,
      meta,
      data,
    });
  };
}

